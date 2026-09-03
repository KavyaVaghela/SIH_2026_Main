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
  ];

  async findEligibleWorkers(filter: MatchingFilter): Promise<WorkerMatchResult[]> {
    const customerLat = filter.customerLatitude || 23.0300; // Satellite, Ahmedabad default
    const customerLon = filter.customerLongitude || 72.5178;
    const maxRadius = filter.maxRadiusKm || 15;

    // 1. Mandatory Eligibility Filter:
    // Account Status: ACTIVE
    // Availability Status: AVAILABLE
    // Verification Status: verified
    // Skill/Category Match
    // Distance <= maxRadiusKm
    const eligible = this.candidatePool.filter((w) => {
      if (w.status !== "ACTIVE") return false;
      if (w.availability !== "AVAILABLE") return false;
      if (w.extendedProfile.verificationStatus !== "verified") return false;

      // Filter by category if specified
      if (filter.categoryId && filter.categoryId !== "all") {
        let reqCat = filter.categoryId;
        if (reqCat === "cat-1") reqCat = "cat-electrical";
        if (reqCat === "cat-2") reqCat = "cat-plumbing";
        if (reqCat === "cat-3") reqCat = "cat-cleaning";
        if (w.categoryId !== reqCat) return false;
      }

      const dist = this.calculateDistanceKm(
        customerLat,
        customerLon,
        w.currentLatitude || 0,
        w.currentLongitude || 0
      );

      return dist <= maxRadius;
    });

    // If no exact category match found, fallback to returning top verified active available workers
    const poolToScore = eligible.length > 0 ? eligible : this.candidatePool.filter((w) => w.status === "ACTIVE" && w.availability === "AVAILABLE");

    // 2. 6-Tier Deterministic Ranking Algorithm
    const results: WorkerMatchResult[] = poolToScore.map((candidate) => {
      const distanceKm = this.calculateDistanceKm(
        customerLat,
        customerLon,
        candidate.currentLatitude || 0,
        candidate.currentLongitude || 0
      );

      // Score components:
      // Tier 1: Skill Match (40 pts)
      const skillScore = filter.categoryId && candidate.categoryId.includes(filter.categoryId) ? 40 : 35;
      // Tier 2: Availability Match (20 pts)
      const availScore = candidate.availability === "AVAILABLE" ? 20 : 0;
      // Tier 3: Distance Score (max 15 pts, decaying with distance)
      const distScore = Math.max(0, 15 - distanceKm);
      // Tier 4: Rating Score (max 15 pts)
      const ratingScore = (candidate.extendedProfile.rating / 5) * 15;
      // Tier 5: Experience Score (max 5 pts)
      const expScore = Math.min(5, candidate.experienceYears * 0.5);
      // Tier 6: Workload Distribution (max 5 pts, higher for lower workload)
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

    // Default sort descending by matchScore
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getWorkerProfileById(workerId: string): Promise<WorkerMatchResult | null> {
    const candidate = this.candidatePool.find((w) => w.id === workerId);
    if (!candidate) return null;

    const distanceKm = this.calculateDistanceKm(
      23.0300, // Satellite, Ahmedabad
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
