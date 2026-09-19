import { ServiceCategory, AnalysisResult, WorkerProfile, ServiceDetail } from "@/types/smartserve";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "plumbing",
    name: "Plumbing",
    description: "Tap repair, pipe leaks & drainage",
    iconName: "Wrench",
    popularServices: ["Pipe Leakage", "Tap Repair", "Drainage Unclogging", "Water Heater Installation"],
    workerCount: 42,
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Wiring, switchboards & MCB repair",
    iconName: "Zap",
    popularServices: ["Electrical Repair", "Fan Installation", "Short Circuit Repair", "Switchboard Fixing"],
    workerCount: 38,
  },
  {
    id: "carpentry",
    name: "Carpentry",
    description: "Furniture assembly & door fixes",
    iconName: "Hammer",
    popularServices: ["Door Repair", "Furniture Assembly", "Lock Fixing", "Custom Cabinet Work"],
    workerCount: 29,
  },
  {
    id: "painting",
    name: "Painting",
    description: "House painting & wall touchups",
    iconName: "Paintbrush",
    popularServices: ["Wall Painting", "Damp Touchup", "Waterproofing", "Exterior Coating"],
    workerCount: 31,
  },
  {
    id: "ac_refrigeration",
    name: "AC & Refrigeration",
    description: "AC servicing, cooling fix & fridge repair",
    iconName: "Tv",
    popularServices: ["AC Servicing", "Gas Topup", "Fridge Repair", "Washing Machine Motor"],
    workerCount: 35,
  },
  {
    id: "computer_it",
    name: "Computer & IT Services",
    description: "Laptop repair, OS installation & hardware",
    iconName: "Monitor",
    popularServices: ["Laptop Screen Repair", "OS & Software Setup", "RAM & SSD Upgrade", "PC Troubleshooting"],
    workerCount: 24,
  },
  {
    id: "mobile_electronics",
    name: "Mobile & Electronics Repair",
    description: "Phone screen, battery & electronics",
    iconName: "Smartphone",
    popularServices: ["Mobile Screen Replacement", "Charging Port Repair", "Tablet Repair", "Gadget Diagnostics"],
    workerCount: 27,
  },
  {
    id: "gas_lpg",
    name: "Gas & LPG Services",
    description: "Gas stove, LPG pipe leak & regulator repair",
    iconName: "Flame",
    popularServices: ["Gas Pipe Leak Repair", "LPG Regulator Fixing", "Stove Connection", "Safety Inspection"],
    workerCount: 26,
  },
  {
    id: "glass_window",
    name: "Glass & Window Services",
    description: "Window glass replacement & mirror installation",
    iconName: "Square",
    popularServices: ["Window Glass Repair", "Mirror Installation", "Glass Door Fitting", "Window Frame Fix"],
    workerCount: 21,
  },
  {
    id: "locksmith_key",
    name: "Locksmith & Key Services",
    description: "Door unlocking, key duplication & lock repair",
    iconName: "Key",
    popularServices: ["Door Lock Repair", "Key Duplication", "Emergency Lockout", "Digital Lock Installation"],
    workerCount: 25,
  },
  {
    id: "water_tank_purification",
    name: "Water Tank & Purification",
    description: "RO repair, filter change & tank cleaning",
    iconName: "Droplets",
    popularServices: ["RO Service & Filter Change", "Water Tank Cleaning", "Purifier Repair", "UV Lamp Replacement"],
    workerCount: 32,
  },
  {
    id: "laundry_drycleaning",
    name: "Laundry & Dry Cleaning",
    description: "Garment dry cleaning, washing & steam ironing",
    iconName: "Shirt",
    popularServices: ["Steam Ironing", "Suit Dry Cleaning", "Curtain Wash", "Laundry Pickup & Delivery"],
    workerCount: 28,
  },
  {
    id: "driver_services",
    name: "Driving & Transportation",
    description: "Personal & outstation drivers",
    iconName: "Car",
    popularServices: ["City Driver", "Outstation Trip", "Luxury Car Driver", "Monthly Personal Driver"],
    workerCount: 33,
  },
  {
    id: "education_tutoring",
    name: "Education & Tutoring",
    description: "Home academic tutors & skill educators",
    iconName: "GraduationCap",
    popularServices: ["Mathematics Tutor", "Science & Physics Tutor", "Language Educator", "Exam Prep Tutor"],
    workerCount: 40,
  },
  {
    id: "tailoring_fashion",
    name: "Tailoring & Fashion",
    description: "Dress alteration, custom fitting & stitching",
    iconName: "Scissors",
    popularServices: ["Dress Alteration", "Suit Fitting", "Zipper Repair", "Custom Stitching"],
    workerCount: 22,
  },
  {
    id: "moving_shifting",
    name: "Home Moving & Shifting",
    description: "Furniture shifting, packing & relocation",
    iconName: "Truck",
    popularServices: ["Furniture Shifting", "Full House Moving", "Heavy Object Lifting", "Packing Services"],
    workerCount: 30,
  },
  {
    id: "cleaning",
    name: "Cleaning",
    description: "Deep house & kitchen sanitization",
    iconName: "Sparkles",
    popularServices: ["Deep Cleaning", "Kitchen Sanitization", "Bathroom Scrubbing", "Sofa & Carpet Wash"],
    workerCount: 54,
  },
  {
    id: "gardening",
    name: "Gardening",
    description: "Lawn care & plant maintenance",
    iconName: "Trees",
    popularServices: ["Lawn Care", "Plant Pruning", "Garden Setup", "Pesticide Spray"],
    workerCount: 19,
  },
];

export const UNSUPPORTED_RESPONSE: AnalysisResult = {
  category: "Unsupported",
  service: "No service detected",
  confidence: 0,
  explanation: "Please describe a valid service problem or request, such as a leaking pipe, gas leakage, broken lock, RO repair, or dry cleaning.",
  urgency: "Low",
  followUpQuestion: "What specific service do you need help with?",
  matchedKeywords: [],
};

export const MOCK_WORKERS: Record<string, WorkerProfile[]> = {
  Plumbing: [
    {
      id: "w1",
      name: "Ramesh Prajapati",
      trade: "Master Plumber",
      rating: 4.9,
      reviewCount: 128,
      jobsCompleted: 340,
      hourlyRate: 350,
      distance: "1.2 km away (Satellite)",
      cooperativeUnit: "Ahmedabad West Trades Co-op #14",
      badge: "KaushalyaSetu Verified Gold",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today in 30 mins",
    },
    {
      id: "w2",
      name: "Suresh Solanki",
      trade: "Pipe Specialist",
      rating: 4.8,
      reviewCount: 94,
      jobsCompleted: 215,
      hourlyRate: 300,
      distance: "2.5 km away (Bodakdev)",
      cooperativeUnit: "Ahmedabad West Trades Co-op #14",
      badge: "Cooperative Certified",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      availability: "Available from 2:00 PM",
    },
  ],
  Electrical: [
    {
      id: "w3",
      name: "Jignesh Patel",
      trade: "Senior Electrician",
      rating: 4.95,
      reviewCount: 176,
      jobsCompleted: 420,
      hourlyRate: 400,
      distance: "0.8 km away (Satellite)",
      cooperativeUnit: "Vejalpur-Satellite Skill Guild",
      badge: "KaushalyaSetu Master Expert",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      availability: "Available Immediately",
    },
    {
      id: "w4",
      name: "Dharmesh Shah",
      trade: "Wiring & Appliance Tech",
      rating: 4.7,
      reviewCount: 82,
      jobsCompleted: 190,
      hourlyRate: 320,
      distance: "3.1 km away (Ambawadi)",
      cooperativeUnit: "Vejalpur-Satellite Skill Guild",
      badge: "Verified Member",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today",
    },
  ],
  Carpentry: [
    {
      id: "w5",
      name: "Mahesh Panchal",
      trade: "Custom Artisan Carpenter",
      rating: 4.88,
      reviewCount: 110,
      jobsCompleted: 280,
      hourlyRate: 450,
      distance: "1.5 km away (Jodhpur)",
      cooperativeUnit: "Viswakarma Wooden Craft Union",
      badge: "Senior Cooperative Artisan",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      availability: "Available Tomorrow 10:00 AM",
    },
  ],
  Painting: [
    {
      id: "w6",
      name: "Bhavesh Makwana",
      trade: "Interior & Moisture Paint Specialist",
      rating: 4.85,
      reviewCount: 95,
      jobsCompleted: 230,
      hourlyRate: 380,
      distance: "2.0 km away (Prahladnagar)",
      cooperativeUnit: "Gujarat Urban Painters Union",
      badge: "KaushalyaSetu Verified",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today",
    },
  ],
  Cleaning: [
    {
      id: "w7",
      name: "Sunita & Team (Sahyog Self-Help)",
      trade: "Sanitization Lead",
      rating: 4.92,
      reviewCount: 210,
      jobsCompleted: 510,
      hourlyRate: 500,
      distance: "1.0 km away (Satellite)",
      cooperativeUnit: "Women Empowerment Sanitation Co-op",
      badge: "Top Rated Cooperative Group",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today 1:00 PM",
    },
  ],
  "AC & Refrigeration": [
    {
      id: "w8",
      name: "Vijay Rathod",
      trade: "HVAC & AC Cooling Specialist",
      rating: 4.9,
      reviewCount: 145,
      jobsCompleted: 390,
      hourlyRate: 450,
      distance: "1.8 km away (Bodakdev)",
      cooperativeUnit: "Ahmedabad Cooling & Tech Guild",
      badge: "KaushalyaSetu Certified Tech",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      availability: "Available in 1 hour",
    },
  ],
  "Appliance Repair": [
    {
      id: "w8",
      name: "Vijay Rathod",
      trade: "HVAC & Appliance Technician",
      rating: 4.9,
      reviewCount: 145,
      jobsCompleted: 390,
      hourlyRate: 450,
      distance: "1.8 km away (Bodakdev)",
      cooperativeUnit: "Ahmedabad Cooling & Tech Guild",
      badge: "KaushalyaSetu Certified Tech",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      availability: "Available in 1 hour",
    },
  ],
  "Computer & IT Services": [
    {
      id: "w9",
      name: "Rahul Mehta",
      trade: "Senior Systems & Laptop Technician",
      rating: 4.93,
      reviewCount: 160,
      jobsCompleted: 345,
      hourlyRate: 480,
      distance: "1.1 km away (Satellite)",
      cooperativeUnit: "Ahmedabad IT & Hardware Co-op",
      badge: "Certified IT Specialist",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today 2:00 PM",
    },
  ],
  "Mobile & Electronics Repair": [
    {
      id: "w10",
      name: "Hardik Solanki",
      trade: "Mobile Screen & Electronics Specialist",
      rating: 4.89,
      reviewCount: 132,
      jobsCompleted: 310,
      hourlyRate: 350,
      distance: "1.4 km away (Jodhpur Circle)",
      cooperativeUnit: "Gujarat Electronics Repair Union",
      badge: "Master Micro-Soldering Tech",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      availability: "Available in 45 mins",
    },
  ],
  "Gas & LPG Services": [
    {
      id: "w17",
      name: "Rakesh Varma",
      trade: "Certified LPG & Gas Safety Technician",
      rating: 4.94,
      reviewCount: 158,
      jobsCompleted: 410,
      hourlyRate: 380,
      distance: "1.1 km away (Satellite)",
      cooperativeUnit: "Gujarat Gas Safety & Appliance Co-op",
      badge: "Government Certified Gas Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      availability: "Available Immediately for Emergency",
    },
    {
      id: "w18",
      name: "Paresh Patel",
      trade: "Stove & LPG Line Fitting Specialist",
      rating: 4.82,
      reviewCount: 96,
      jobsCompleted: 230,
      hourlyRate: 320,
      distance: "2.3 km away (Vejalpur)",
      cooperativeUnit: "Gujarat Gas Safety & Appliance Co-op",
      badge: "Verified Co-op Technician",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today",
    },
  ],
  "Glass & Window Services": [
    {
      id: "w19",
      name: "Imran Glass Works",
      trade: "Architectural Glass & Window Specialist",
      rating: 4.88,
      reviewCount: 104,
      jobsCompleted: 260,
      hourlyRate: 400,
      distance: "1.6 km away (Bodakdev)",
      cooperativeUnit: "Ahmedabad Glass & Glazing Craftsmen",
      badge: "Master Glass Craftsman",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today 2:30 PM",
    },
  ],
  "Locksmith & Key Services": [
    {
      id: "w20",
      name: "Salim Key Maker",
      trade: "Emergency Locksmith & Key Specialist",
      rating: 4.96,
      reviewCount: 240,
      jobsCompleted: 580,
      hourlyRate: 350,
      distance: "0.7 km away (Satellite)",
      cooperativeUnit: "Ahmedabad Locksmith & Security Guild",
      badge: "Emergency Unlocking Expert",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      availability: "Available Immediately (24x7 Emergency)",
    },
  ],
  "Water Tank & Purification": [
    {
      id: "w21",
      name: "WaterCare RO Techs",
      trade: "RO Service & Water Purification Lead",
      rating: 4.91,
      reviewCount: 180,
      jobsCompleted: 440,
      hourlyRate: 350,
      distance: "1.3 km away (Jodhpur)",
      cooperativeUnit: "Gujarat Pure Water Technicians Co-op",
      badge: "OEM Certified RO Specialist",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today in 1 hour",
    },
  ],
  "Laundry & Dry Cleaning": [
    {
      id: "w22",
      name: "Modern White Dry Cleaners",
      trade: "Dry Cleaning & Garment Care Lead",
      rating: 4.87,
      reviewCount: 165,
      jobsCompleted: 490,
      hourlyRate: 250,
      distance: "0.9 km away (Satellite)",
      cooperativeUnit: "Ahmedabad Cleaners & Laundry Guild",
      badge: "Free Pickup & Delivery Co-op",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      availability: "Pickup Available Today",
    },
  ],
  "Driving & Transportation": [
    {
      id: "w11",
      name: "Kirit Parmar",
      trade: "Outstation & Personal Driver",
      rating: 4.95,
      reviewCount: 220,
      jobsCompleted: 640,
      hourlyRate: 300,
      distance: "0.9 km away (Satellite)",
      cooperativeUnit: "Ahmedabad Driver Cooperative Federation",
      badge: "Gold Commercial License Holder",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      availability: "Available Tomorrow 6:00 AM",
    },
  ],
  "Education & Tutoring": [
    {
      id: "w12",
      name: "Prof. Sanjay Joshi",
      trade: "Mathematics & Science Home Tutor",
      rating: 4.97,
      reviewCount: 185,
      jobsCompleted: 490,
      hourlyRate: 500,
      distance: "1.3 km away (Satellite)",
      cooperativeUnit: "Gujarat Educators Cooperative Guild",
      badge: "M.Sc. Mathematics Certified Teacher",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      availability: "Available Evening 5:00 PM",
    },
  ],
  "Tailoring & Fashion": [
    {
      id: "w13",
      name: "Meena Ben",
      trade: "Master Tailor & Dress Alterations Lead",
      rating: 4.91,
      reviewCount: 165,
      jobsCompleted: 430,
      hourlyRate: 250,
      distance: "1.0 km away (Satellite)",
      cooperativeUnit: "Sahyog Women Artisans & Tailors Co-op",
      badge: "Senior Master Craftsman",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today",
    },
  ],
  "Home Moving & Shifting": [
    {
      id: "w14",
      name: "Jay Ambe Express Movers",
      trade: "Furniture Shifting & Packing Crew Lead",
      rating: 4.87,
      reviewCount: 155,
      jobsCompleted: 380,
      hourlyRate: 600,
      distance: "2.2 km away (Bodakdev)",
      cooperativeUnit: "Ahmedabad Household Packers & Movers Co-op",
      badge: "Verified Logistics Team",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      availability: "Available Tomorrow 8:00 AM",
    },
  ],
  "Gardening": [
    {
      id: "w15",
      name: "Mohan Mistry",
      trade: "Landscape & Garden Specialist",
      rating: 4.83,
      reviewCount: 89,
      jobsCompleted: 210,
      hourlyRate: 300,
      distance: "1.6 km away (Satellite)",
      cooperativeUnit: "Green Ahmedabad Horticulture Guild",
      badge: "Certified Horticulturist",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today",
    },
  ],
  "Other / General Services": [
    {
      id: "w16",
      name: "KaushalyaSetu Multi-Trade Taskforce",
      trade: "General Assistance Lead",
      rating: 4.85,
      reviewCount: 120,
      jobsCompleted: 310,
      hourlyRate: 350,
      distance: "1.0 km away (Satellite)",
      cooperativeUnit: "Ahmedabad Central Trades Cooperative Union",
      badge: "KaushalyaSetu General Certified",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      availability: "Available Today",
    },
  ],
};

export function analyzeProblem(promptText: string, hasImage: boolean = false): AnalysisResult {
  const query = promptText.toLowerCase().trim();

  // 1. Empty or whitespace check
  if (!query && !hasImage) {
    return UNSUPPORTED_RESPONSE;
  }

  // 2. Length check (>1000 characters)
  if (query.length > 1000) {
    return {
      category: "Unsupported",
      service: "No service detected",
      confidence: 0,
      explanation: "Your description exceeds the 1,000 character limit. Please shorten your problem description.",
      urgency: "Low",
      followUpQuestion: "Can you summarize your problem in a few sentences?",
      matchedKeywords: [],
    };
  }

  // 3. Greetings check
  const GREETINGS = [
    "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
    "how are you", "how r u", "namaste", "hola", "sup", "yo", "hi there", "hello there"
  ];
  if (GREETINGS.includes(query) || (GREETINGS.some(g => query === g) && !hasImage)) {
    return UNSUPPORTED_RESPONSE;
  }

  // 4. Random characters / spam / off-topic check
  const OFF_TOPIC_PATTERNS = [
    "joke", "tell me", "who is", "president", "capital of", "code", "poem",
    "sing", "weather", "calculator", "recipe", "asdf", "qwerty", "12345"
  ];
  if (OFF_TOPIC_PATTERNS.some(pattern => query.includes(pattern)) && !hasImage) {
    return UNSUPPORTED_RESPONSE;
  }

  // Gibberish check
  if (/^[a-z0-9]{6,}$/i.test(query) && !/[aeiouy]{2,}/i.test(query) && !hasImage) {
    return UNSUPPORTED_RESPONSE;
  }

  // 5. Gas Leakage Hazard Check
  if (
    query.includes("gas leak") ||
    query.includes("gas smell") ||
    query.includes("lpg leak") ||
    query.includes("cylinder leak") ||
    query.includes("smell gas")
  ) {
    return {
      category: "Gas & LPG Services",
      service: "LPG & Gas Leak Emergency Inspection",
      confidence: 99,
      explanation: "CRITICAL GAS SAFETY ALERT: Gas or LPG leakage reported! Close main cylinder regulator valve immediately, open all windows, avoid electrical switches, and evacuate if smell is heavy.",
      urgency: "High",
      isHazardous: true,
      emergencyType: "GAS_LEAKAGE",
      followUpQuestion: "Have you turned off the main cylinder regulator valve?",
      matchedKeywords: ["gas leak", "emergency"],
      estimatedPriceRange: "₹250 - ₹500",
      recommendedWorkers: MOCK_WORKERS["Gas & LPG Services"],
    };
  }

  // 6. General Safety Emergency Check
  if (
    query.includes("smoke") ||
    query.includes("fire") ||
    query.includes("live wire") ||
    query.includes("electric shock hazard") ||
    query.includes("flooding")
  ) {
    return {
      category: query.includes("fire") ? "Unsupported" : "Electrical",
      service: "Emergency Hazard Warning",
      confidence: 99,
      explanation: "CRITICAL SAFETY ALERT: Fire or live wire hazards detected! Evacuate if needed and contact emergency services (101/108).",
      urgency: "High",
      isHazardous: true,
      followUpQuestion: "Are you in a safe location?",
      matchedKeywords: ["hazard", "emergency"],
    };
  }

  // 7. Gas & LPG Services (non-emergency)
  if (
    query.includes("gas") ||
    query.includes("lpg") ||
    query.includes("stove") ||
    query.includes("cylinder") ||
    query.includes("regulator")
  ) {
    return {
      category: "Gas & LPG Services",
      service: "Gas Stove & LPG Line Service",
      confidence: 96,
      explanation: "Gas appliance or LPG line connection request detected. Certified gas safety technicians ensure leak-proof fittings.",
      matchedKeywords: ["gas", "lpg", "stove"],
      urgency: "Medium",
      followUpQuestion: "Is the issue with the stove burner or cylinder pipe regulator?",
      estimatedPriceRange: "₹250 - ₹600",
      recommendedWorkers: MOCK_WORKERS["Gas & LPG Services"],
    };
  }

  // 8. Glass & Window Services
  if (
    query.includes("glass") ||
    query.includes("window") ||
    query.includes("mirror") ||
    query.includes("pane")
  ) {
    return {
      category: "Glass & Window Services",
      service: query.includes("window") ? "Window Glass Repair & Replacement" : "Glass & Mirror Installation",
      confidence: 95,
      explanation: "Broken glass, window frame repair, or custom mirror installation requirement detected.",
      matchedKeywords: ["glass", "window", "mirror"],
      urgency: query.includes("broken") ? "High" : "Low",
      followUpQuestion: "Are there sharp glass shards that need safe removal?",
      estimatedPriceRange: "₹300 - ₹900",
      recommendedWorkers: MOCK_WORKERS["Glass & Window Services"],
    };
  }

  // 9. Locksmith & Key Services
  if (
    query.includes("lock") ||
    query.includes("key") ||
    query.includes("lockout") ||
    query.includes("unlock") ||
    query.includes("lost key")
  ) {
    return {
      category: "Locksmith & Key Services",
      service: query.includes("lost key") || query.includes("lockout") ? "Emergency Door Unlocking & Keying" : "Door Lock Repair & Replacement",
      confidence: 97,
      explanation: "Lock failure, lost keys, or emergency door lockout detected. Experienced locksmiths provide non-destructive door opening and key duplication.",
      matchedKeywords: ["lock", "key", "locksmith"],
      urgency: query.includes("lockout") || query.includes("lost") ? "High" : "Medium",
      followUpQuestion: "Are you currently locked outside your property?",
      estimatedPriceRange: "₹250 - ₹700",
      recommendedWorkers: MOCK_WORKERS["Locksmith & Key Services"],
    };
  }

  // 10. Water Tank & Purification
  if (
    query.includes("ro") ||
    query.includes("purifier") ||
    query.includes("water tank") ||
    query.includes("purification") ||
    query.includes("filter replacement") ||
    query.includes("water filter")
  ) {
    return {
      category: "Water Tank & Purification",
      service: query.includes("ro") || query.includes("purifier") ? "RO Filter & Purifier Repair" : "Overhead Water Tank Cleaning",
      confidence: 96,
      explanation: "RO water purifier servicing or overhead water tank sanitization request detected. Certified technicians replace filters and sanitize tank walls.",
      matchedKeywords: ["ro", "purifier", "water tank"],
      urgency: "Medium",
      followUpQuestion: "Is the RO unit making unusual noise or leaking water?",
      estimatedPriceRange: "₹350 - ₹1,200",
      recommendedWorkers: MOCK_WORKERS["Water Tank & Purification"],
    };
  }

  // 11. Laundry & Dry Cleaning
  if (
    query.includes("laundry") ||
    query.includes("dry cleaning") ||
    query.includes("iron") ||
    query.includes("ironing") ||
    query.includes("clothes wash") ||
    query.includes("garment")
  ) {
    return {
      category: "Laundry & Dry Cleaning",
      service: query.includes("dry clean") ? "Suit & Premium Garment Dry Cleaning" : "Steam Ironing & Laundry Pickup",
      confidence: 96,
      explanation: "Garment care, steam ironing, or dry cleaning request detected. Free doorstep pickup and delivery by cooperative cleaners.",
      matchedKeywords: ["laundry", "dry cleaning", "ironing"],
      urgency: "Low",
      followUpQuestion: "How many garments require dry cleaning or steam ironing?",
      estimatedPriceRange: "₹150 - ₹600",
      recommendedWorkers: MOCK_WORKERS["Laundry & Dry Cleaning"],
    };
  }

  // 12. Computer & IT Services
  if (
    query.includes("laptop") ||
    query.includes("computer") ||
    query.includes("pc") ||
    query.includes("macbook") ||
    query.includes("windows") ||
    query.includes("turning on") ||
    query.includes("hard drive") ||
    query.includes("ssd") ||
    query.includes("ram")
  ) {
    return {
      category: "Computer & IT Services",
      service: query.includes("laptop") ? "Laptop Diagnostics & Repair" : "Computer System Repair",
      confidence: 95,
      explanation: "Computing hardware or software issues detected. Experienced IT technicians resolve OS booting, RAM/SSD upgrades, and hardware faults.",
      matchedKeywords: ["laptop", "computer"],
      urgency: "Medium",
      followUpQuestion: "Is the laptop showing any LED indicators when powering on?",
      estimatedPriceRange: "₹350 - ₹900",
      recommendedWorkers: MOCK_WORKERS["Computer & IT Services"],
    };
  }

  // 13. Mobile & Electronics Repair
  if (
    query.includes("phone") ||
    query.includes("mobile") ||
    query.includes("screen") ||
    query.includes("cracked") ||
    query.includes("display") ||
    query.includes("charging port") ||
    query.includes("tablet")
  ) {
    return {
      category: "Mobile & Electronics Repair",
      service: "Mobile Screen & Electronics Repair",
      confidence: 96,
      explanation: "Mobile display glass damage or electronic port malfunction detected.",
      matchedKeywords: ["phone", "screen"],
      urgency: "Medium",
      followUpQuestion: "Is the touch screen responding behind the glass?",
      estimatedPriceRange: "₹400 - ₹1,200",
      recommendedWorkers: MOCK_WORKERS["Mobile & Electronics Repair"],
    };
  }

  // 14. Education & Tutoring
  if (
    query.includes("tutor") ||
    query.includes("math") ||
    query.includes("mathematics") ||
    query.includes("tuition") ||
    query.includes("teacher") ||
    query.includes("study")
  ) {
    return {
      category: "Education & Tutoring",
      service: "Academic Home Tutoring",
      confidence: 96,
      explanation: "Request for specialized academic home tutoring.",
      matchedKeywords: ["tutor", "education"],
      urgency: "Low",
      followUpQuestion: "What academic grade level is the student in?",
      estimatedPriceRange: "₹400 - ₹800 / session",
      recommendedWorkers: MOCK_WORKERS["Education & Tutoring"],
    };
  }

  // 15. Driving & Transportation
  if (
    query.includes("driver") ||
    query.includes("driving") ||
    query.includes("chauffeur") ||
    query.includes("car drive") ||
    query.includes("outstation trip")
  ) {
    return {
      category: "Driving & Transportation",
      service: "Personal / Outstation Driver Service",
      confidence: 97,
      explanation: "Verified professional driver service request.",
      matchedKeywords: ["driver", "car"],
      urgency: "Medium",
      followUpQuestion: "Do you require an in-city or outstation driver?",
      estimatedPriceRange: "₹300 - ₹1,000",
      recommendedWorkers: MOCK_WORKERS["Driving & Transportation"],
    };
  }

  // 16. Tailoring & Fashion
  if (
    query.includes("dress") ||
    query.includes("alter") ||
    query.includes("alteration") ||
    query.includes("tailor") ||
    query.includes("stitch") ||
    query.includes("fitting")
  ) {
    return {
      category: "Tailoring & Fashion",
      service: "Dress Alteration & Tailoring",
      confidence: 95,
      explanation: "Garment alteration or custom fitting requirement detected.",
      matchedKeywords: ["dress", "alteration"],
      urgency: "Low",
      followUpQuestion: "Do you need doorstep measurement taking?",
      estimatedPriceRange: "₹150 - ₹500",
      recommendedWorkers: MOCK_WORKERS["Tailoring & Fashion"],
    };
  }

  // 17. Home Moving & Shifting
  if (
    query.includes("move") ||
    query.includes("moving") ||
    query.includes("shifting") ||
    query.includes("packers") ||
    query.includes("relocation")
  ) {
    return {
      category: "Home Moving & Shifting",
      service: "Furniture Shifting & Packing",
      confidence: 96,
      explanation: "Furniture shifting or household packing request.",
      matchedKeywords: ["moving", "shifting"],
      urgency: "Medium",
      followUpQuestion: "Are there heavy items requiring stairs transport?",
      estimatedPriceRange: "₹500 - ₹2,500",
      recommendedWorkers: MOCK_WORKERS["Home Moving & Shifting"],
    };
  }

  // 18. AC & Refrigeration
  if (
    query.includes("ac") ||
    query.includes("air conditioner") ||
    query.includes("cool") ||
    query.includes("fridge") ||
    query.includes("refrigerator")
  ) {
    return {
      category: "AC & Refrigeration",
      service: "AC Servicing & Gas Refill",
      confidence: 97,
      explanation: "Household cooling appliance servicing request.",
      matchedKeywords: ["ac", "cooling"],
      urgency: "Medium",
      followUpQuestion: "Is the AC compressor turning on?",
      estimatedPriceRange: "₹350 - ₹1,000",
      recommendedWorkers: MOCK_WORKERS["AC & Refrigeration"],
    };
  }

  // 19. Electrical
  if (
    query.includes("fan") ||
    query.includes("switch") ||
    query.includes("spark") ||
    query.includes("shock") ||
    query.includes("circuit") ||
    query.includes("mcb") ||
    query.includes("wire") ||
    query.includes("light") ||
    query.includes("power") ||
    query.includes("electrician")
  ) {
    return {
      category: "Electrical",
      service: "Electrical Repair",
      confidence: 94,
      explanation: "Electrical circuit or fixture malfunction detected.",
      matchedKeywords: ["electrical", "wiring"],
      urgency: "Medium",
      followUpQuestion: "Has the main circuit breaker tripped?",
      estimatedPriceRange: "₹200 - ₹500",
      recommendedWorkers: MOCK_WORKERS["Electrical"],
    };
  }

  // 20. Carpentry
  if (
    query.includes("door") ||
    query.includes("wood") ||
    query.includes("furniture") ||
    query.includes("hinge") ||
    query.includes("table") ||
    query.includes("carpenter")
  ) {
    return {
      category: "Carpentry",
      service: "Furniture & Door Repair",
      confidence: 94,
      explanation: "Carpentry work required for wooden fittings or furniture.",
      matchedKeywords: ["carpentry", "furniture"],
      urgency: "Low",
      followUpQuestion: "Is the wood frame damaged?",
      estimatedPriceRange: "₹300 - ₹750",
      recommendedWorkers: MOCK_WORKERS["Carpentry"],
    };
  }

  // 21. Painting
  if (
    query.includes("paint") ||
    query.includes("wall") ||
    query.includes("damp") ||
    query.includes("painter")
  ) {
    return {
      category: "Painting",
      service: "Wall Painting & Patching",
      confidence: 93,
      explanation: "Surface damage or wall touchup requirements detected.",
      matchedKeywords: ["paint", "wall"],
      urgency: "Low",
      followUpQuestion: "Is there active moisture seepage?",
      estimatedPriceRange: "₹500 - ₹1,500",
      recommendedWorkers: MOCK_WORKERS["Painting"],
    };
  }

  // 22. Cleaning
  if (
    query.includes("clean") ||
    query.includes("dirty") ||
    query.includes("kitchen") ||
    query.includes("bathroom") ||
    query.includes("wash")
  ) {
    return {
      category: "Cleaning",
      service: "Deep Cleaning & Sanitization",
      confidence: 96,
      explanation: "Sanitization and deep grease/dust removal needed.",
      matchedKeywords: ["cleaning"],
      urgency: "Low",
      followUpQuestion: "Which rooms require deep cleaning?",
      estimatedPriceRange: "₹400 - ₹1,200",
      recommendedWorkers: MOCK_WORKERS["Cleaning"],
    };
  }

  // 23. Plumbing
  if (
    query.includes("pipe") ||
    query.includes("leak") ||
    query.includes("tap") ||
    query.includes("sink") ||
    query.includes("drain") ||
    query.includes("plumber")
  ) {
    return {
      category: "Plumbing",
      service: "Pipe & Tap Repair",
      confidence: 95,
      explanation: "Plumbing fixture or pipe leakage repair required.",
      matchedKeywords: ["plumbing", "pipe"],
      urgency: "Medium",
      followUpQuestion: "Is the water supply turned off?",
      estimatedPriceRange: "₹250 - ₹600",
      recommendedWorkers: MOCK_WORKERS["Plumbing"],
    };
  }

  // 24. Gardening
  if (
    query.includes("plant") ||
    query.includes("garden") ||
    query.includes("lawn")
  ) {
    return {
      category: "Gardening",
      service: "Garden & Lawn Maintenance",
      confidence: 94,
      explanation: "Horticulture setup or plant pruning required.",
      matchedKeywords: ["gardening"],
      urgency: "Low",
      followUpQuestion: "Do you need routine pruning or complete lawn maintenance?",
      estimatedPriceRange: "₹300 - ₹700",
      recommendedWorkers: MOCK_WORKERS["Gardening"],
    };
  }

  // 25. Other / General Services (Legitimate unmatched service)
  return {
    category: "Other / General Services",
    service: "General Service Diagnostic",
    confidence: 70,
    explanation: "Your request has been matched to our General Trades Cooperative team.",
    matchedKeywords: [query.slice(0, 20)],
    urgency: "Low",
    followUpQuestion: "Could you describe what specific service you need help with?",
    visualAnalysis: hasImage ? "Visual scan processed by General Trades unit." : undefined,
    estimatedPriceRange: "₹250 - ₹500",
    recommendedWorkers: MOCK_WORKERS["Other / General Services"],
  };
}

export function getServiceDetails(categoryName: string): ServiceDetail {
  const workers = MOCK_WORKERS[categoryName] || MOCK_WORKERS["Other / General Services"] || [];
  return {
    category: categoryName,
    serviceName: `${categoryName} Service & Repair`,
    description: `Official KaushalyaSetu cooperative trade service for ${categoryName.toLowerCase()} in Satellite, Ahmedabad. Transparent fixed pricing, background-verified technicians, and government cooperative quality assurance.`,
    estimatedTime: "30 - 45 Mins Arrival",
    startingPrice: 249,
    workers: workers,
  };
}
