export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  mapApiKey: process.env.NEXT_PUBLIC_MAP_API_KEY || "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
} as const;
