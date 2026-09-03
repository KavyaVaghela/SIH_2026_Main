export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  iconName?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  basePrice: number;
  minimumVisitCharge: number;
  priceUnit: string;
  isOther?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceCatalogService {
  getCategories(): Promise<ServiceCategory[]>;
  getServicesByCategory(categoryId: string): Promise<ServiceItem[]>;
  getServiceDetails(serviceId: string): Promise<ServiceItem | null>;
  getAllActiveServices(): Promise<ServiceItem[]>;
}

export class ServiceCatalogService implements IServiceCatalogService {
  private categories: ServiceCategory[] = [
    { id: "cat-plumbing", name: "Plumbing & Drainage", description: "Tap repairs, pipe leakage, water tanks", iconName: "Wrench", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-electrical", name: "Electrical & Wiring", description: "Home electrical repairs, MCB & installations", iconName: "Zap", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-carpentry", name: "Carpentry & Woodwork", description: "Furniture assembly, door locks & fixes", iconName: "Hammer", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-painting", name: "House Painting", description: "Wall touchups, interior & exterior painting", iconName: "Paintbrush", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-cleaning", name: "Deep House Cleaning", description: "Full house sanitization, kitchen & bathroom deep clean", iconName: "Sparkles", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-appliance", name: "Appliance Repair", description: "AC, Refrigerator & Washing Machine service", iconName: "Tv", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-gardening", name: "Gardening & Lawn Care", description: "Lawn care, plant maintenance & pruning", iconName: "TreePine", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-driver", name: "Driver Services", description: "Personal daily drivers & outstation trips", iconName: "Car", isActive: true, createdAt: new Date().toISOString() },
  ];

  private services: ServiceItem[] = [
    // PLUMBING (10 options)
    { id: "srv-p1", categoryId: "cat-plumbing", title: "Tap Repair", description: "Fixing dripping taps, valves, and washers", basePrice: 250, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p2", categoryId: "cat-plumbing", title: "Pipe Leakage", description: "Repairing concealed or exposed pipeline leaks", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p3", categoryId: "cat-plumbing", title: "Drainage Blockage", description: "Clearing clogged sink, bathroom, or balcony drain", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p4", categoryId: "cat-plumbing", title: "Bathroom Plumbing", description: "Full bathroom pipeline repair and fixture fitting", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p5", categoryId: "cat-plumbing", title: "Kitchen Plumbing", description: "Sink coupling, dishwasher inlet & drain fixes", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p6", categoryId: "cat-plumbing", title: "Sink Repair", description: "Fixing basin leaks, traps & drain pipes", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p7", categoryId: "cat-plumbing", title: "Toilet Repair", description: "Flush tank repair, jet spray & seat replacement", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p8", categoryId: "cat-plumbing", title: "Water Tank / Pipeline Work", description: "Overhead tank cleaning, valve fitting & pipeline work", basePrice: 600, minimumVisitCharge: 300, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p9", categoryId: "cat-plumbing", title: "Mixer / Shower Repair", description: "Wall mixer, diverter & hand shower fixing", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-p10", categoryId: "cat-plumbing", title: "Other", description: "Custom plumbing task requiring inspection", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // ELECTRICAL (10 options)
    { id: "srv-e1", categoryId: "cat-electrical", title: "Switch / Socket Repair", description: "Installing or replacing damaged electrical sockets", basePrice: 200, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e2", categoryId: "cat-electrical", title: "Fan Installation", description: "Mounting ceiling, exhaust or wall fans", basePrice: 250, minimumVisitCharge: 200, priceUnit: "per_item", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e3", categoryId: "cat-electrical", title: "Fan Repair", description: "Regulator replacement, noise & speed fix", basePrice: 250, minimumVisitCharge: 200, priceUnit: "per_item", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e4", categoryId: "cat-electrical", title: "Light Installation", description: "Mounting tube lights, LEDs, chandeliers & spotlights", basePrice: 200, minimumVisitCharge: 200, priceUnit: "per_item", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e5", categoryId: "cat-electrical", title: "Wiring Repair", description: "Diagnosing room electrical wiring and replacing cables", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e6", categoryId: "cat-electrical", title: "MCB Repair", description: "Installing main distribution board MCBs & trippers", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e7", categoryId: "cat-electrical", title: "Short Circuit Issue", description: "Urgent short circuit detection & safety resolution", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e8", categoryId: "cat-electrical", title: "Switchboard Repair", description: "Fixing modular switchboards, earthing & wiring", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e9", categoryId: "cat-electrical", title: "Appliance Connection", description: "Heavy appliance power point & inverter wiring", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-e10", categoryId: "cat-electrical", title: "Other", description: "Custom electrical work requiring inspection", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // CARPENTRY & WOODWORK (9 options)
    { id: "srv-c1", categoryId: "cat-carpentry", title: "Door Lock & Handle Fitting", description: "Replacing mortise locks, latches & handles", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c2", categoryId: "cat-carpentry", title: "Door Repair", description: "Hinge fixing, door trimming & alignment", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c3", categoryId: "cat-carpentry", title: "Window Repair", description: "Wooden window channel, latch & glass frame repair", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c4", categoryId: "cat-carpentry", title: "Furniture Assembly & Repair", description: "Assembling bed, wardrobe, dining table & chairs", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c5", categoryId: "cat-carpentry", title: "Cabinet / Cupboard Repair", description: "Drawer channel, hydraulic hinge & shelf fixing", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c6", categoryId: "cat-carpentry", title: "Bed / Table Repair", description: "Frame reinforcement, slat repair & joint tightening", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c7", categoryId: "cat-carpentry", title: "Modular Furniture Work", description: "Disassembly, reassembly & modular kitchen fitting", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c8", categoryId: "cat-carpentry", title: "Wood Polish / Minor Repair", description: "Scratch touchup, varnish & minor wood polishing", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-c9", categoryId: "cat-carpentry", title: "Other", description: "Custom carpentry work requiring inspection", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // PAINTING (8 options)
    { id: "srv-pt1", categoryId: "cat-painting", title: "Room Painting", description: "Full room interior wall & ceiling painting", basePrice: 2200, minimumVisitCharge: 1500, priceUnit: "per_room", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-pt2", categoryId: "cat-painting", title: "Wall Touch-up", description: "Fixing wall cracks, putty & patch painting", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_wall", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-pt3", categoryId: "cat-painting", title: "Exterior Painting", description: "Exterior weatherproof facade painting", basePrice: 3500, minimumVisitCharge: 2000, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-pt4", categoryId: "cat-painting", title: "Door / Window Painting", description: "Enamel paint or varnish coat for doors & windows", basePrice: 450, minimumVisitCharge: 300, priceUnit: "per_unit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-pt5", categoryId: "cat-painting", title: "Ceiling Painting", description: "Ceiling primer, white coat & damp proofing", basePrice: 800, minimumVisitCharge: 500, priceUnit: "per_room", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-pt6", categoryId: "cat-painting", title: "Waterproof Coating", description: "Dampness treatment & waterproofing primer", basePrice: 1200, minimumVisitCharge: 800, priceUnit: "per_wall", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-pt7", categoryId: "cat-painting", title: "Texture / Finish Work", description: "Designer wall texture, stencil & accent walls", basePrice: 1800, minimumVisitCharge: 1000, priceUnit: "per_wall", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-pt8", categoryId: "cat-painting", title: "Other", description: "Custom painting task requiring inspection", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // CLEANING (8 options)
    { id: "srv-cl1", categoryId: "cat-cleaning", title: "Home Deep Cleaning", description: "Complete house sanitization, scrubbing & dusting", basePrice: 1800, minimumVisitCharge: 1500, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-cl2", categoryId: "cat-cleaning", title: "Kitchen Cleaning", description: "Degreasing tiles, cabinets, stove & chimney", basePrice: 1200, minimumVisitCharge: 1000, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-cl3", categoryId: "cat-cleaning", title: "Bathroom Cleaning", description: "Tile descaling, toilet bowl sanitization & mirror polish", basePrice: 600, minimumVisitCharge: 400, priceUnit: "per_room", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-cl4", categoryId: "cat-cleaning", title: "Sofa Cleaning", description: "Fabric shampooing, vacuuming & stain removal", basePrice: 800, minimumVisitCharge: 500, priceUnit: "per_set", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-cl5", categoryId: "cat-cleaning", title: "Floor Cleaning", description: "Machine floor scrubbing, buffing & tile polishing", basePrice: 1000, minimumVisitCharge: 700, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-cl6", categoryId: "cat-cleaning", title: "Move-in / Move-out Cleaning", description: "Deep vacant apartment cleaning before occupancy", basePrice: 2200, minimumVisitCharge: 1800, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-cl7", categoryId: "cat-cleaning", title: "Sanitization", description: "Disinfectant fogging and surface sanitization", basePrice: 700, minimumVisitCharge: 500, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-cl8", categoryId: "cat-cleaning", title: "Other", description: "Custom cleaning job requiring inspection", basePrice: 500, minimumVisitCharge: 400, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // APPLIANCE REPAIR (8 options)
    { id: "srv-ap1", categoryId: "cat-appliance", title: "AC Service / Repair", description: "Filter cleaning, gas checking & cooling inspection", basePrice: 500, minimumVisitCharge: 350, priceUnit: "per_unit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-ap2", categoryId: "cat-appliance", title: "Refrigerator Repair", description: "Compressor, cooling coil & thermostat fix", basePrice: 450, minimumVisitCharge: 300, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-ap3", categoryId: "cat-appliance", title: "Washing Machine Repair", description: "Drum noise, motor issues or drainage fix", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-ap4", categoryId: "cat-appliance", title: "Geyser Repair", description: "Heating element, thermostat & water leakage fix", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-ap5", categoryId: "cat-appliance", title: "Microwave Repair", description: "Magnetron, keypad & heating issue diagnostic", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-ap6", categoryId: "cat-appliance", title: "Water Purifier Repair", description: "RO membrane replacement, filter change & leakage", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-ap7", categoryId: "cat-appliance", title: "Fan / Cooler Repair", description: "Air cooler pump, motor replacement & fan repair", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-ap8", categoryId: "cat-appliance", title: "Other", description: "Custom appliance repair requiring inspection", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // GARDENING (7 options)
    { id: "srv-g1", categoryId: "cat-gardening", title: "Lawn Maintenance", description: "Lawn mowing, grass trimming & weed removal", basePrice: 450, minimumVisitCharge: 300, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-g2", categoryId: "cat-gardening", title: "Plant Care", description: "Fertilizer application, pest spray & plant nutrition", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-g3", categoryId: "cat-gardening", title: "Garden Cleanup", description: "Removing dry leaves, debris & garden waste", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-g4", categoryId: "cat-gardening", title: "Tree / Shrub Trimming", description: "Branch pruning, hedge shaping & plant trimming", basePrice: 500, minimumVisitCharge: 350, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-g5", categoryId: "cat-gardening", title: "Potting / Replanting", description: "Repotting plants in fresh soil mix & pots", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-g6", categoryId: "cat-gardening", title: "Irrigation / Watering Setup", description: "Drip irrigation pipe fitting & sprinkler check", basePrice: 600, minimumVisitCharge: 400, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-g7", categoryId: "cat-gardening", title: "Other", description: "Custom gardening work requiring inspection", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // DRIVER SERVICES (6 options)
    { id: "srv-d1", categoryId: "cat-driver", title: "Local Driver", description: "Experienced city driver for short local commutes (4 hrs)", basePrice: 500, minimumVisitCharge: 350, priceUnit: "per_slot", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-d2", categoryId: "cat-driver", title: "Outstation Driver", description: "Intercity highway driver for long-distance trips", basePrice: 1200, minimumVisitCharge: 800, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-d3", categoryId: "cat-driver", title: "Personal Driver", description: "Full-day dedicated private driver (8 hrs)", basePrice: 900, minimumVisitCharge: 600, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-d4", categoryId: "cat-driver", title: "Event Driver", description: "Chauffeur for weddings, parties & corporate events", basePrice: 800, minimumVisitCharge: 500, priceUnit: "per_event", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-d5", categoryId: "cat-driver", title: "Airport Transfer Driver", description: "Timely pickup and drop to Ahmedabad Airport", basePrice: 450, minimumVisitCharge: 300, priceUnit: "per_trip", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-d6", categoryId: "cat-driver", title: "Other", description: "Custom driver requirement requiring confirmation", basePrice: 400, minimumVisitCharge: 300, priceUnit: "per_trip", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  async getCategories(): Promise<ServiceCategory[]> {
    return this.categories.filter((c) => c.isActive);
  }

  async getServicesByCategory(categoryId: string): Promise<ServiceItem[]> {
    let targetId = categoryId;
    if (categoryId === "cat-1") targetId = "cat-electrical";
    if (categoryId === "cat-2") targetId = "cat-plumbing";
    if (categoryId === "cat-3") targetId = "cat-cleaning";

    const matched = this.services.filter((s) => s.categoryId === targetId && s.isActive);
    if (matched.length > 0) return matched;
    return this.services.filter((s) => s.isActive);
  }

  async getServiceDetails(serviceId: string): Promise<ServiceItem | null> {
    return this.services.find((s) => s.id === serviceId) || null;
  }

  async getAllActiveServices(): Promise<ServiceItem[]> {
    return this.services.filter((s) => s.isActive);
  }
}

export const serviceCatalogService = new ServiceCatalogService();
