import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeProblem, UNSUPPORTED_RESPONSE, MOCK_WORKERS } from "@/lib/smartserve-ai";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_LENGTH = 1000;

const ALLOWED_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Cleaning",
  "AC & Refrigeration",
  "Appliance Repair",
  "Gardening",
  "Driving & Transportation",
  "Computer & IT Services",
  "Mobile & Electronics Repair",
  "Education & Tutoring",
  "Tailoring & Fashion",
  "Home Moving & Shifting",
  "Gas & LPG Services",
  "Glass & Window Services",
  "Locksmith & Key Services",
  "Water Tank & Purification",
  "Laundry & Dry Cleaning",
  "Other / General Services",
  "Unsupported",
];

const ALLOWED_URGENCIES = ["Low", "Medium", "High"];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const description = (formData.get("description") as string) || "";
    const image = formData.get("image") as File | null;

    const trimmedDescription = description.trim();
    const hasDescription = Boolean(trimmedDescription);
    const hasImage = Boolean(image && image.size > 0);

    // 1. Input Validation: Missing both
    if (!hasDescription && !hasImage) {
      return NextResponse.json(
        { error: "Please describe your problem or attach an image." },
        { status: 400 }
      );
    }

    // 2. Length Validation (>1,000 chars)
    if (trimmedDescription.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Description exceeds maximum limit of ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // 3. Image Validation (MIME type & 5MB size limit)
    if (hasImage && image) {
      if (image.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Image size exceeds 5 MB limit. Please upload a smaller image." },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(image.type.toLowerCase())) {
        return NextResponse.json(
          { error: "Unsupported image format. Please upload a JPG, JPEG, PNG, or WEBP photo." },
          { status: 400 }
        );
      }
    }

    // 4. Server Pre-Check for Greetings / Spam / Gibberish / Hazards
    const localDiagnostic = analyzeProblem(trimmedDescription, hasImage);
    if (localDiagnostic.category === "Unsupported") {
      return NextResponse.json(UNSUPPORTED_RESPONSE);
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback if key missing or unconfigured placeholder
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(localDiagnostic);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use Gemini 3.6 Flash model
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

      const systemPrompt = `You are SmartServe AI, an expert service classification & safety assistant for KaushalyaSetu.

You are analyzing a user's service request. Analyze BOTH the user's text and the uploaded image when an image is provided. Identify the actual object/problem visible in the image. Do not assume the request is a traditional household plumbing request. Do not default to Plumbing. Return the most appropriate supported service category.

STRICT CLASSIFICATION RULES:
1. ONLY ALLOW THESE CATEGORIES:
   - Plumbing
   - Electrical
   - Carpentry
   - Painting
   - Cleaning
   - AC & Refrigeration
   - Appliance Repair
   - Gardening
   - Driving & Transportation
   - Computer & IT Services
   - Mobile & Electronics Repair
   - Education & Tutoring
   - Tailoring & Fashion
   - Home Moving & Shifting
   - Gas & LPG Services
   - Glass & Window Services
   - Locksmith & Key Services
   - Water Tank & Purification
   - Laundry & Dry Cleaning
   - Other / General Services
   - Unsupported

2. CATEGORY MATCHING EXAMPLES:
   - "Gas leakage in kitchen" or "LPG pipe leak" or gas cylinder image -> Gas & LPG Services (Set isHazardous: true, emergencyType: "GAS_LEAKAGE", urgency: "High")
   - "My window glass is broken" or glass pane image -> Glass & Window Services
   - "I lost my house key" or "My door lock is broken" or lock image -> Locksmith & Key Services
   - "My RO is not working" or "Clean my water tank" or RO purifier image -> Water Tank & Purification
   - "I need dry cleaning" or "Iron my clothes" or clothing laundry image -> Laundry & Dry Cleaning
   - "My AC is not cooling" or AC image -> AC & Refrigeration
   - "Repair my laptop" or laptop image -> Computer & IT Services
   - "My phone screen is cracked" or phone image -> Mobile & Electronics Repair
   - "I need an electrician" or fan/switch image -> Electrical
   - "I need a carpenter" or wooden furniture image -> Carpentry
   - "I need someone to paint my house" -> Painting
   - "My tap is leaking" or pipe leak image -> Plumbing
   - "I need a driver tomorrow" or car image -> Driving & Transportation
   - "I need a mathematics tutor" -> Education & Tutoring
   - "I need my dress altered" -> Tailoring & Fashion
   - "Help me move my furniture" -> Home Moving & Shifting

3. CONFLICT & AGREEMENT EVALUATION:
   When BOTH text and image are provided:
   - If text and image match or relate to the same service category -> set "inputAgreement": "MATCH"
   - If text description and image show completely different conflicting services (e.g. text says "laptop broken" but image shows a broken window glass pane) -> set "inputAgreement": "CONFLICT", set "explanation": "CONFLICT DETECTED: The text description mentions laptop repair, but the attached image shows a broken window glass.", and set "followUpQuestion": "Did you need laptop repair or window glass replacement?"
   - When only text is provided -> set "inputAgreement": "TEXT_ONLY"
   - When only image is provided -> set "inputAgreement": "IMAGE_ONLY"

4. UNCLEAR / AMBIGUOUS INPUT RULE:
   If the user request is ambiguous or unclear, set category to "Other / General Services" and followUpQuestion to "I'm not sure which service you need. Could you describe what you need help with?". DO NOT fallback to Plumbing.

5. UNSUPPORTED CATEGORY RULE:
   If the user input is a greeting (e.g. "hello", "hi", "good morning"), off-topic query, joke, random characters ("asdfgh123"), or completely unrelated to any trade service, YOU MUST RETURN STRICTLY THIS JSON:
   {
     "category": "Unsupported",
     "service": "No household service detected",
     "confidence": 0,
     "explanation": "Please describe a service problem or request, such as a leaking pipe, gas leakage, broken lock, RO repair, or dry cleaning.",
     "urgency": "Low",
     "followUpQuestion": "What service do you need help with?"
   }

6. SAFETY & EMERGENCY RULE:
   Do NOT provide DIY repair instructions for hazardous situations (gas leaks, fire, smoke, live exposed wires, flooding).
   If gas leakage, fire, or live wires are reported:
   - Set "urgency": "High"
   - Set "isHazardous": true
   - Set "emergencyType": "GAS_LEAKAGE" (for gas) or "ELECTRICAL_HAZARD"
   - Recommend evacuating and calling emergency services (1906 for gas, 108/101 for fire/hazard).

User Input Text: "${trimmedDescription || "None provided"}"
Image Attached: ${hasImage ? "Yes" : "No"}

Return ONLY raw JSON matching this schema (no markdown backticks, no code blocks):
{
  "category": "Plumbing | Electrical | Carpentry | Painting | Cleaning | AC & Refrigeration | Appliance Repair | Gardening | Driving & Transportation | Computer & IT Services | Mobile & Electronics Repair | Education & Tutoring | Tailoring & Fashion | Home Moving & Shifting | Gas & LPG Services | Glass & Window Services | Locksmith & Key Services | Water Tank & Purification | Laundry & Dry Cleaning | Other / General Services | Unsupported",
  "service": "Specific service name",
  "confidence": <integer 0-100>,
  "explanation": "Short 1-2 sentence explanation based on text and visual evidence",
  "urgency": "Low | Medium | High",
  "followUpQuestion": "Short clarifying question",
  "isHazardous": boolean,
  "emergencyType": "GAS_LEAKAGE | ELECTRICAL_HAZARD | NONE",
  "inputAgreement": "MATCH | TEXT_ONLY | IMAGE_ONLY | CONFLICT | UNCLEAR"
}`;

      // Build payload with system prompt + text + image (SINGLE GEMINI REQUEST)
      const contents: (string | { inlineData: { mimeType: string; data: string } })[] = [systemPrompt];

      if (hasImage && image) {
        const arrayBuffer = await image.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        contents.push({
          inlineData: {
            mimeType: image.type,
            data: base64Data,
          },
        });
      }

      // Exactly ONE generateContent call per Analyze action
      const result = await model.generateContent(contents);
      const responseText = result.response.text();

      const cleanedText = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsedJSON = JSON.parse(cleanedText);

      // Validate returned JSON
      const rawCategory = parsedJSON.category || "Other / General Services";
      const validCategory = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : "Other / General Services";

      if (validCategory === "Unsupported") {
        return NextResponse.json(UNSUPPORTED_RESPONSE);
      }

      const rawUrgency = parsedJSON.urgency || "Medium";
      const validUrgency = ALLOWED_URGENCIES.includes(rawUrgency) ? rawUrgency : "Medium";
      const rawConfidence = typeof parsedJSON.confidence === "number" ? Math.min(100, Math.max(0, parsedJSON.confidence)) : 90;
      const isConflict = parsedJSON.inputAgreement === "CONFLICT";
      
      // Do NOT recommend workers if there is an unresolved text/image conflict
      const matchedWorkers = isConflict ? [] : (MOCK_WORKERS[validCategory] || MOCK_WORKERS["Other / General Services"] || []);

      return NextResponse.json({
        category: validCategory,
        service: parsedJSON.service || `${validCategory} Service`,
        confidence: rawConfidence,
        explanation: parsedJSON.explanation || "AI analyzed input and matched to verified cooperative trade service.",
        urgency: validUrgency,
        isHazardous: Boolean(parsedJSON.isHazardous),
        emergencyType: parsedJSON.emergencyType || (validCategory === "Gas & LPG Services" && parsedJSON.isHazardous ? "GAS_LEAKAGE" : undefined),
        inputAgreement: parsedJSON.inputAgreement || (hasImage && hasDescription ? "MATCH" : hasImage ? "IMAGE_ONLY" : "TEXT_ONLY"),
        followUpQuestion: parsedJSON.followUpQuestion || "Would you like us to schedule a verified technician?",
        matchedKeywords: [trimmedDescription.slice(0, 15)],
        visualAnalysis: hasImage ? "Visual scan verified by Gemini Vision model." : undefined,
        estimatedPriceRange: "₹250 - ₹750 (Govt. Co-op standard rates)",
        recommendedWorkers: matchedWorkers,
      });
    } catch (geminiErr: unknown) {
      console.warn("Gemini API call error:", geminiErr);
      const errString = String((geminiErr as Error)?.message || geminiErr);

      // Check specifically for HTTP 429 / Rate Limit / Quota Exceeded error
      const isQuotaError =
        errString.includes("429") ||
        errString.includes("RESOURCE_EXHAUSTED") ||
        errString.includes("Quota exceeded") ||
        errString.includes("quota");

      if (isQuotaError) {
        const retryMatch = errString.match(/retry after ([0-9]+s?)/i) || errString.match(/in ([0-9]+s?)/i);
        const retryAfter = retryMatch ? retryMatch[1] : undefined;

        return NextResponse.json(
          {
            success: false,
            error: "GEMINI_QUOTA_EXCEEDED",
            message: "AI analysis is temporarily unavailable because the Gemini API request limit has been reached.",
            retryAfter: retryAfter,
          },
          { status: 429 }
        );
      }

      // For non-quota errors, return local diagnostic fallback
      return NextResponse.json(localDiagnostic);
    }
  } catch (err) {
    console.error("Analyze service API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request. Please try again." },
      { status: 500 }
    );
  }
}
