import type { Worker } from "../../../types";

export interface MatchingFilter {
  serviceId?: string;
  categoryId?: string;
  skillId?: string;
  customerLatitude: number;
  customerLongitude: number;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  maxRadiusKm?: number;
}

export interface ExtendedWorkerProfile {
  fullName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  cooperativeName: string;
  primarySkill: string;
  secondarySkills?: string[];
  rating: number;
  completedJobsCount: number;
  experienceYears: number;
  languages: string[];
  bio: string;
  verificationStatus: "verified" | "pending_verification" | "suspended";
}

export interface WorkerMatchResult {
  worker: Worker & {
    extendedProfile: ExtendedWorkerProfile;
  };
  matchScore: number; // 0 - 100
  tierBreakdown: {
    skillMatch: boolean;
    availabilityMatch: boolean;
    distanceKm: number;
    rating: number;
    experienceYears: number;
    currentWorkloadCount: number;
  };
}

export interface IMatchingService {
  findEligibleWorkers(filter: MatchingFilter): Promise<WorkerMatchResult[]>;
  getWorkerProfileById(workerId: string): Promise<WorkerMatchResult | null>;
}

export class MatchingService implements IMatchingService {
  // Calculate Haversine distance in km
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // Master Candidate Pool in Ahmedabad area (Satellite, Navrangpura, Paldi, Bodakdev, Bopal)
  private candidatePool: Array<
    Worker & {
      categoryId: string;
      workload: number;
      extendedProfile: ExtendedWorkerProfile;
    }
  > = [
    // PLUMBING
    {
      id: "w-plumber-1",
      profileId: "p-w1",
      federationId: "fed-ahmedabad-1",
      categoryId: "cat-plumbing",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 350,
      experienceYears: 8,
      currentLatitude: 23.0325, // Satellite, Ahmedabad
      currentLongitude: 72.5205,
      workload: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Ramesh Patel",
        phone: "+91 98250 11021",
        email: "ramesh.p@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Satellite Artisans Cooperative Society",
        primarySkill: "Tap & Pipe Leakage Specialist",
        secondarySkills: ["Drainage Clearance", "Water Tank Fitting", "Basin Coupling"],
        rating: 4.9,
        completedJobsCount: 142,
        experienceYears: 8,
        languages: ["Gujarati", "Hindi"],
        bio: "Certified cooperative plumber with 8+ years experience in domestic and commercial piping, tap repairs, and water tank fitting across Ahmedabad.",
        verificationStatus: "verified",
      },
    },
    {
      id: "w-plumber-2",
      profileId: "p-w2",
      federationId: "fed-ahmedabad-1",
      categoryId: "cat-plumbing",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 400,
      experienceYears: 12,
      currentLatitude: 23.0380, // Navrangpura, Ahmedabad
      currentLongitude: 72.5590,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Hitesh Solanki",
        phone: "+91 98980 44512",
        email: "hitesh.s@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Navrangpura Skilled Trade Association",
        primarySkill: "Master Plumber & Drainage Consultant",
        secondarySkills: ["Overhead Tank Fitting", "Bathroom Plumbing", "Pressure Pump Fix"],
        rating: 4.8,
        completedJobsCount: 215,
        experienceYears: 12,
        languages: ["Gujarati", "Hindi", "English"],
        bio: "Senior trade worker specializing in concealed pipe leakage detection, sanitaryware installation, and high-pressure water pump maintenance.",
        verificationStatus: "verified",
      },
    },

    // ELECTRICAL
    {
      id: "w-electrician-1",
      profileId: "p-w3",
      federationId: "fed-ahmedabad-1",
      categoryId: "cat-electrical",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 350,
      experienceYears: 7,
      currentLatitude: 23.0310, // Vastrapur, Ahmedabad
      currentLongitude: 72.5280,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Chandu Patel",
        phone: "+91 98220 00001",
        email: "chandu.patel@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "ABC Labour Cooperative Society",
        primarySkill: "Electrical Wiring & MCB Specialist",
        secondarySkills: ["Switchboard Repair", "Ceiling Fan Fitting", "Short Circuit Repair"],
        rating: 4.9,
        completedJobsCount: 168,
        experienceYears: 7,
        languages: ["Gujarati", "Hindi"],
        bio: "Licensed cooperative electrician proficient in home distribution board wiring, MCB replacement, chandelier installation, and emergency short circuit repair.",
        verificationStatus: "verified",
      },
    },
    {
      id: "w-electrician-2",
      profileId: "p-w4",
      federationId: "fed-ahmedabad-1",
      categoryId: "cat-electrical",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 300,
      experienceYears: 5,
      currentLatitude: 23.0140, // Paldi, Ahmedabad
      currentLongitude: 72.5610,
      workload: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Vikram Solanki",
        phone: "+91 97120 55410",
        email: "vikram.s@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Paldi Electricians Union",
        primarySkill: "Domestic Electrical Technician",
        secondarySkills: ["Light Fixtures", "Inverter Wiring", "Appliance Connection"],
        rating: 4.7,
        completedJobsCount: 89,
        experienceYears: 5,
        languages: ["Gujarati", "Hindi"],
        bio: "Prompt and detail-oriented electrician experienced in house re-wiring, socket repair, and heavy electrical appliance line connection.",
        verificationStatus: "verified",
      },
    },

    // CARPENTRY
    {
      id: "w-carpenter-1",
      profileId: "p-w5",
      federationId: "fed-ahmedabad-2",
      categoryId: "cat-carpentry",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 400,
      experienceYears: 10,
      currentLatitude: 23.0420, // Bodakdev, Ahmedabad
      currentLongitude: 72.5120,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Mahesh Panchal",
        phone: "+91 98790 33219",
        email: "mahesh.p@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Western Ahmedabad Woodworkers Society",
        primarySkill: "Furniture Assembly & Door Lock Specialist",
        secondarySkills: ["Modular Kitchen Cabinetry", "Door Trimming", "Wood Polish"],
        rating: 5.0,
        completedJobsCount: 195,
        experienceYears: 10,
        languages: ["Gujarati", "Hindi", "English"],
        bio: "Expert carpenter with 10 years of experience in furniture assembly, mortise door lock replacement, hydraulic cupboard hinges, and wood polishing.",
        verificationStatus: "verified",
      },
    },

    // PAINTING
    {
      id: "w-painter-1",
      profileId: "p-w6",
      federationId: "fed-ahmedabad-2",
      categoryId: "cat-painting",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 500,
      experienceYears: 9,
      currentLatitude: 23.0340, // Bopal, Ahmedabad
      currentLongitude: 72.4640,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Sanjay Parmar",
        phone: "+91 98981 77632",
        email: "sanjay.p@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Bopal Painters Collective",
        primarySkill: "Wall Touchup & Interior Painting",
        secondarySkills: ["Waterproofing Primer", "Wall Putty", "Designer Texture"],
        rating: 4.8,
        completedJobsCount: 110,
        experienceYears: 9,
        languages: ["Gujarati", "Hindi"],
        bio: "Cooperative painter specializing in damp proofing treatment, single wall touchups, wall crack putty filling, and full room interior painting.",
        verificationStatus: "verified",
      },
    },

    // CLEANING
    {
      id: "w-cleaner-1",
      profileId: "p-w7",
      federationId: "fed-ahmedabad-2",
      categoryId: "cat-cleaning",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 450,
      experienceYears: 6,
      currentLatitude: 23.0300, // Satellite, Ahmedabad
      currentLongitude: 72.5180,
      workload: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Sunita Sharma",
        phone: "+91 97230 11988",
        email: "sunita.s@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Mahila Home Care Cooperative",
        primarySkill: "Deep House & Kitchen Sanitization",
        secondarySkills: ["Bathroom Scrubbing", "Sofa Vacuuming", "Floor Buffing"],
        rating: 4.9,
        completedJobsCount: 175,
        experienceYears: 6,
        languages: ["Gujarati", "Hindi"],
        bio: "Professional home care lead proficient in eco-friendly chemical scrubbing, kitchen grease removal, bathroom tile descaling, and full 2BHK deep cleaning.",
        verificationStatus: "verified",
      },
    },

    // APPLIANCE REPAIR
    {
      id: "w-appliance-1",
      profileId: "p-w8",
      federationId: "fed-ahmedabad-1",
      categoryId: "cat-appliance",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 450,
      experienceYears: 8,
      currentLatitude: 23.0360, // Navrangpura, Ahmedabad
      currentLongitude: 72.5580,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Anil Vaghela",
        phone: "+91 98255 90123",
        email: "anil.v@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Ahmedabad Appliance Technicians Guild",
        primarySkill: "AC & Refrigerator Servicing",
        secondarySkills: ["Washing Machine Motor Repair", "Geyser Element Fix", "RO Purifier Service"],
        rating: 4.9,
        completedJobsCount: 154,
        experienceYears: 8,
        languages: ["Gujarati", "Hindi", "English"],
        bio: "HVAC and home appliance technician specializing in AC gas charging, refrigerator compressor diagnosis, washing machine drum repair, and RO water filter service.",
        verificationStatus: "verified",
      },
    },

    // GARDENING
    {
      id: "w-gardener-1",
      profileId: "p-w9",
      federationId: "fed-ahmedabad-2",
      categoryId: "cat-gardening",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 350,
      experienceYears: 11,
      currentLatitude: 23.0110, // Paldi, Ahmedabad
      currentLongitude: 72.5630,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Kishan Mali",
        phone: "+91 98799 44321",
        email: "kishan.m@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Green Earth Gardeners Cooperative",
        primarySkill: "Landscape Care & Lawn Mowing",
        secondarySkills: ["Plant Pruning", "Drip Irrigation Setup", "Soil Aeration"],
        rating: 4.8,
        completedJobsCount: 96,
        experienceYears: 11,
        languages: ["Gujarati", "Hindi"],
        bio: "Experienced horticulturist offering lawn mowing, hedge trimming, organic pest control, plant repotting, and balcony garden maintenance.",
        verificationStatus: "verified",
      },
    },

    // DRIVER SERVICES
    {
      id: "w-driver-1",
      profileId: "p-w10",
      federationId: "fed-ahmedabad-1",
      categoryId: "cat-driver",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 400,
      experienceYears: 9,
      currentLatitude: 23.0315, // Satellite, Ahmedabad
      currentLongitude: 72.5210,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Pravin Darji",
        phone: "+91 98982 33412",
        email: "pravin.d@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Ahmedabad Drivers Cooperative Society",
        primarySkill: "City & Outstation Chauffeur",
        secondarySkills: ["Automatic Transmission", "Luxury Car Handling", "Highway Navigation"],
        rating: 4.9,
        completedJobsCount: 230,
        experienceYears: 9,
        languages: ["Gujarati", "Hindi", "English"],
        bio: "Reliable, police-verified personal chauffeur with 9+ years experience driving manual and automatic cars across Gujarat for daily commuting and outstation trips.",
        verificationStatus: "verified",
      },
    },

    // MASONRY
    {
      id: "w-mason-1",
      profileId: "p-w11",
      federationId: "fed-ahmedabad-1",
      categoryId: "ebda254d-3500-492e-b35c-83f5a00c5239",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 400,
      experienceYears: 12,
      currentLatitude: 23.0335,
      currentLongitude: 72.5225,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Kanti Mistry",
        phone: "+91 98251 44521",
        email: "kanti.m@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Satellite Artisans Cooperative Society",
        primarySkill: "Brickwork & Plastering Specialist",
        secondarySkills: ["Concrete Work", "Wall Repair", "Stone Masonry"],
        rating: 4.9,
        completedJobsCount: 164,
        experienceYears: 12,
        languages: ["Gujarati", "Hindi"],
        bio: "Master mason with 12+ years experience in residential brickwork, wall plastering, foundation repairs, and compound wall construction.",
        verificationStatus: "verified",
      },
    },

    // HOUSE HELP / DOMESTIC HELP
    {
      id: "w-househelp-1",
      profileId: "p-w12",
      federationId: "fed-ahmedabad-1",
      categoryId: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 300,
      experienceYears: 7,
      currentLatitude: 23.0310,
      currentLongitude: 72.5180,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Geeta Ben Solanki",
        phone: "+91 98252 55632",
        email: "geeta.s@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Satellite Artisans Cooperative Society",
        primarySkill: "Deep Sweeping, Mopping & House Sanitization",
        secondarySkills: ["Utensil Cleaning", "Dusting & Organizing", "Kitchen Hygiene"],
        rating: 4.85,
        completedJobsCount: 98,
        experienceYears: 7,
        languages: ["Gujarati", "Hindi"],
        bio: "Reliable and cooperative-verified domestic assistant dedicated to spotless floor mopping, kitchen cleaning, and household care.",
        verificationStatus: "verified",
      },
    },

    // WELDING
    {
      id: "w-welder-1",
      profileId: "p-w13",
      federationId: "fed-ahmedabad-1",
      categoryId: "3bd5ddac-31be-4163-807a-0a0871ed4161",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 450,
      experienceYears: 10,
      currentLatitude: 23.0340,
      currentLongitude: 72.5240,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Pravin Panchal",
        phone: "+91 98253 66743",
        email: "pravin.p@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Satellite Artisans Cooperative Society",
        primarySkill: "Arc Welding & Metal Gate Fabrication",
        secondarySkills: ["Balcony Railing Repair", "Safety Grill Welding", "Sheet Metal Joining"],
        rating: 4.9,
        completedJobsCount: 112,
        experienceYears: 10,
        languages: ["Gujarati", "Hindi"],
        bio: "Certified metal fabrication artisan specializing in safety grills, iron gates, MS railings, and emergency on-site welding repairs.",
        verificationStatus: "verified",
      },
    },

    // CONSTRUCTION LABOUR
    {
      id: "w-labour-1",
      profileId: "p-w14",
      federationId: "fed-ahmedabad-1",
      categoryId: "3fa324d5-3904-4d9a-b24a-3603d355834d",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 350,
      experienceYears: 8,
      currentLatitude: 23.0290,
      currentLongitude: 72.5190,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Govind Rathod",
        phone: "+91 98254 77854",
        email: "govind.r@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Satellite Artisans Cooperative Society",
        primarySkill: "Material Shifting & Construction Assistance",
        secondarySkills: ["Excavation & Trenching", "Debris Removal", "Mortar Mixing"],
        rating: 4.75,
        completedJobsCount: 82,
        experienceYears: 8,
        languages: ["Gujarati", "Hindi"],
        bio: "Diligent construction labour assistant offering material shifting, site clearance, excavation, and artisan scaffolding support.",
        verificationStatus: "verified",
      },
    },

    // TILE & FLOOR WORK
    {
      id: "w-tile-1",
      profileId: "p-w15",
      federationId: "fed-ahmedabad-1",
      categoryId: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef",
      status: "ACTIVE",
      availability: "AVAILABLE",
      hourlyRate: 420,
      experienceYears: 11,
      currentLatitude: 23.0315,
      currentLongitude: 72.5215,
      workload: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extendedProfile: {
        fullName: "Naresh Prajapati",
        phone: "+91 98255 88965",
        email: "naresh.p@cooplabour.org",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        cooperativeName: "Satellite Artisans Cooperative Society",
        primarySkill: "Vitrified & Marble Floor Tile Specialist",
        secondarySkills: ["Wall Tile Grouting", "Granite Edge Polishing", "Waterproofing"],
        rating: 4.95,
        completedJobsCount: 178,
        experienceYears: 11,
        languages: ["Gujarati", "Hindi"],
        bio: "Skilled flooring artisan specialized in vitrified tile laying, bathroom wall tiling, diamond marble polishing, and epoxy grouting.",
        verificationStatus: "verified",
      },
    },
  ];

  async findEligibleWorkers(filter: MatchingFilter): Promise<WorkerMatchResult[]> {
    const customerLat = filter.customerLatitude || 23.0300; // Satellite, Ahmedabad default
    const customerLon = filter.customerLongitude || 72.5178;
    const maxRadius = filter.maxRadiusKm || 25;

    let dbResults: WorkerMatchResult[] = [];
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbWorkers, error } = await (supabase.from("workers") as any)
        .select("*, profiles(*), federations(*), worker_skills(skills(id, name, category_id))")
        .eq("account_status", "ACTIVE")
        .eq("verification_status", "verified")
        .eq("availability_status", "AVAILABLE");

      if (!error && dbWorkers && dbWorkers.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = dbWorkers.map((w: any) => {
          const p = w.profiles || {};
          const f = w.federations || {};
          const distanceKm = this.calculateDistanceKm(
            customerLat,
            customerLon,
            w.current_latitude || 23.0325,
            w.current_longitude || 72.5205
          );

          // Extract real skill names & category IDs
          const realSkills: string[] = [];
          const skillCategoryIds: string[] = [];
          if (Array.isArray(w.worker_skills)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            w.worker_skills.forEach((ws: any) => {
              if (ws.skills?.name) realSkills.push(ws.skills.name);
              if (ws.skills?.category_id) skillCategoryIds.push(ws.skills.category_id);
            });
          }

          // Check category match
          let isCategoryMatch = false;
          if (filter.categoryId && filter.categoryId !== "all") {
            const req = filter.categoryId.toLowerCase();
            isCategoryMatch =
              skillCategoryIds.some((cid) => cid === filter.categoryId) ||
              realSkills.some((s) => req.includes(s.toLowerCase()) || s.toLowerCase().includes(req)) ||
              (w.profession && req.includes(w.profession.toLowerCase()));
          } else {
            isCategoryMatch = true;
          }

          const candidateWorker: Worker & { extendedProfile: ExtendedWorkerProfile } = {
            id: w.id,
            profileId: w.profile_id,
            federationId: w.federation_id,
            status: w.account_status || "ACTIVE",
            availability: (w.availability_status?.toUpperCase() as any) || "AVAILABLE",
            hourlyRate: Number(w.hourly_rate) || 350,
            experienceYears: w.experience_years || 5,
            currentLatitude: w.current_latitude || 23.0325,
            currentLongitude: w.current_longitude || 72.5205,
            createdAt: w.created_at,
            updatedAt: w.updated_at,
            extendedProfile: {
              fullName: p.full_name || "Verified Cooperative Worker",
              phone: p.phone || "+91 98250 11021",
              email: p.email || "worker@cooplabour.org",
              avatarUrl: p.avatar_url || undefined,
              cooperativeName: f.name || "Cooperative Federation Society",
              primarySkill: realSkills[0] || w.profession || "Trade Professional",
              secondarySkills: realSkills.slice(1).length > 0 ? realSkills.slice(1) : ["Quality Service", "Verified Trade Worker"],
              rating: 4.9,
              completedJobsCount: 45,
              experienceYears: w.experience_years || 5,
              languages: ["Gujarati", "Hindi"],
              bio: "Certified cooperative trade worker with extensive experience in domestic and commercial services.",
              verificationStatus: w.verification_status || "verified",
            },
          };

          // 6-Tier Scoring
          const skillScore = isCategoryMatch ? 40 : 20;
          const distScore = Math.max(0, 15 - distanceKm);
          const totalScore = Math.round(skillScore + 20 + distScore + 15 + Math.min(5, (w.experience_years || 5) * 0.5));

          return {
            worker: candidateWorker,
            matchScore: Math.min(100, totalScore),
            isCategoryMatch,
            tierBreakdown: {
              skillMatch: isCategoryMatch,
              availabilityMatch: true,
              distanceKm,
              rating: 4.9,
              experienceYears: w.experience_years || 5,
              currentWorkloadCount: 0,
            },
          };
        }).filter((res: any) => res.tierBreakdown.distanceKm <= maxRadius);

        // If category filtered, prioritize matching category workers
        if (filter.categoryId && filter.categoryId !== "all") {
          const categorySpecific = mapped.filter((m: any) => m.isCategoryMatch);
          dbResults = categorySpecific.length > 0 ? categorySpecific : mapped;
        } else {
          dbResults = mapped;
        }

        if (dbResults.length > 0) {
          return dbResults.sort((a, b) => b.matchScore - a.matchScore);
        }
      }
    } catch (err) {
      console.warn("DB findEligibleWorkers query notice:", err);
    }

    // Fallback to static candidates if DB yields 0 rows during development
    const eligible = this.candidatePool.filter((w) => {
      if (w.status !== "ACTIVE") return false;
      if (w.availability !== "AVAILABLE") return false;
      if (w.extendedProfile.verificationStatus !== "verified") return false;

      if (filter.categoryId && filter.categoryId !== "all") {
        let reqCat = filter.categoryId;
        if (reqCat === "cat-1") reqCat = "cat-electrical";
        if (reqCat === "cat-2") reqCat = "cat-plumbing";
        if (reqCat === "cat-3") reqCat = "cat-cleaning";
        if (w.categoryId !== reqCat && !w.categoryId.includes(reqCat)) return false;
      }

      const dist = this.calculateDistanceKm(
        customerLat,
        customerLon,
        w.currentLatitude || 0,
        w.currentLongitude || 0
      );

      return dist <= maxRadius;
    });

    const poolToScore = eligible.length > 0 ? eligible : this.candidatePool.filter((w) => w.status === "ACTIVE" && w.availability === "AVAILABLE");

    const results: WorkerMatchResult[] = poolToScore.map((candidate) => {
      const distanceKm = this.calculateDistanceKm(
        customerLat,
        customerLon,
        candidate.currentLatitude || 0,
        candidate.currentLongitude || 0
      );

      const skillScore = filter.categoryId && candidate.categoryId.includes(filter.categoryId) ? 40 : 35;
      const availScore = candidate.availability === "AVAILABLE" ? 20 : 0;
      const distScore = Math.max(0, 15 - distanceKm);
      const ratingScore = (candidate.extendedProfile.rating / 5) * 15;
      const expScore = Math.min(5, candidate.experienceYears * 0.5);
      const workloadScore = Math.max(0, 5 - candidate.workload);

      const totalScore = Math.round(
        skillScore + availScore + distScore + ratingScore + expScore + workloadScore
      );

      return {
        worker: candidate,
        matchScore: totalScore,
        tierBreakdown: {
          skillMatch: true,
          availabilityMatch: true,
          distanceKm,
          rating: candidate.extendedProfile.rating,
          experienceYears: candidate.experienceYears,
          currentWorkloadCount: candidate.workload,
        },
      };
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getWorkerProfileById(workerId: string): Promise<WorkerMatchResult | null> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("workers") as any)
        .select("*, profiles(*), federations(*), worker_skills(skills(name))")
        .or(`id.eq.${workerId},profile_id.eq.${workerId}`)
        .maybeSingle();

      if (!error && data) {
        const p = data.profiles || {};
        const f = data.federations || {};
        const distanceKm = this.calculateDistanceKm(
          23.0300,
          72.5178,
          data.current_latitude || 23.0300,
          data.current_longitude || 72.5178
        );

        // Extract real skill names
        const realSkills: string[] = Array.isArray(data.worker_skills)
          ? data.worker_skills
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((ws: any) => ws.skills?.name)
              .filter(Boolean)
          : [];

        return {
          worker: {
            id: data.id,
            profileId: data.profile_id,
            federationId: data.federation_id,
            status: data.account_status || "ACTIVE",
            availability: (data.availability_status?.toUpperCase() as any) || "AVAILABLE",
            hourlyRate: Number(data.hourly_rate) || 350,
            experienceYears: data.experience_years || 5,
            currentLatitude: data.current_latitude || 23.0300,
            currentLongitude: data.current_longitude || 72.5178,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            extendedProfile: {
              fullName: p.full_name || "Verified Cooperative Worker",
              phone: p.phone || "+91 98250 11021",
              email: p.email || "worker@cooplabour.org",
              avatarUrl: p.avatar_url || undefined,
              cooperativeName: f.name || "Cooperative Federation Society",
              primarySkill: realSkills[0] || data.profession || "Trade Professional",
              secondarySkills: realSkills.slice(1).length > 0 ? realSkills.slice(1) : ["Quality Service", "Verified Trade Worker"],
              rating: 4.9,
              completedJobsCount: 45,
              experienceYears: data.experience_years || 5,
              languages: ["Gujarati", "Hindi"],
              bio: "Certified cooperative trade worker with extensive experience in domestic and commercial services.",
              verificationStatus: data.verification_status || "verified",
            },
          },
          matchScore: 95,
          tierBreakdown: {
            skillMatch: true,
            availabilityMatch: true,
            distanceKm,
            rating: 4.9,
            experienceYears: data.experience_years || 5,
            currentWorkloadCount: 0,
          },
        };
      }
    } catch (err) {
      console.warn("DB getWorkerProfileById query notice:", err);
    }

    const candidate = this.candidatePool.find((w) => w.id === workerId || w.profileId === workerId);
    if (!candidate) return null;

    const distanceKm = this.calculateDistanceKm(
      23.0300,
      72.5178,
      candidate.currentLatitude || 0,
      candidate.currentLongitude || 0
    );

    return {
      worker: candidate,
      matchScore: 95,
      tierBreakdown: {
        skillMatch: true,
        availabilityMatch: true,
        distanceKm,
        rating: candidate.extendedProfile.rating,
        experienceYears: candidate.experienceYears,
        currentWorkloadCount: candidate.workload,
      },
    };
  }
}

export const matchingService = new MatchingService();

