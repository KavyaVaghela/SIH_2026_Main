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
    { id: "ebda254d-3500-492e-b35c-83f5a00c5239", name: "Masonry", description: "Brickwork, plastering, wall repair & concrete construction", iconName: "Building2", isActive: true, createdAt: new Date().toISOString() },
    { id: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea", name: "House Help / Domestic Help", description: "Daily household cleaning, mopping, dishwashing & dusting", iconName: "Home", isActive: true, createdAt: new Date().toISOString() },
    { id: "3bd5ddac-31be-4163-807a-0a0871ed4161", name: "Welding", description: "Arc welding, gate & grill repair, structural metalwork", iconName: "Flame", isActive: true, createdAt: new Date().toISOString() },
    { id: "3fa324d5-3904-4d9a-b24a-3603d355834d", name: "Construction Labour", description: "Site shifting, material handling, earth excavation & site assistance", iconName: "HardHat", isActive: true, createdAt: new Date().toISOString() },
    { id: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef", name: "Tile & Floor Work", description: "Floor tile laying, wall tiles, grouting, marble & granite polishing", iconName: "Layers", isActive: true, createdAt: new Date().toISOString() },
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

    // MASONRY (5 options)
    { id: "srv-mas1", categoryId: "ebda254d-3500-492e-b35c-83f5a00c5239", title: "Brickwork & Wall Construction", description: "Standard red brick & fly ash block masonry", basePrice: 600, minimumVisitCharge: 300, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-mas2", categoryId: "ebda254d-3500-492e-b35c-83f5a00c5239", title: "Plastering & Patch Repair", description: "Internal cement plastering and wall crack repair", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-mas3", categoryId: "ebda254d-3500-492e-b35c-83f5a00c5239", title: "Concrete Mixing & Slab Work", description: "Foundational concrete casting and slab repair", basePrice: 700, minimumVisitCharge: 400, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-mas4", categoryId: "ebda254d-3500-492e-b35c-83f5a00c5239", title: "Boundary Wall Repair", description: "Repairing compound walls and precast fencing", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-mas5", categoryId: "ebda254d-3500-492e-b35c-83f5a00c5239", title: "Other Masonry Work", description: "Custom brick, cement or concrete tasks", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_service", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // HOUSE HELP / DOMESTIC HELP (5 options)
    { id: "srv-hh1", categoryId: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea", title: "Daily House Cleaning & Mopping", description: "Complete floor sweeping, wet mopping & dusting", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-hh2", categoryId: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea", title: "Utensil Washing & Kitchen Sink Clean", description: "Vessel washing, dish drying & kitchen counter wipe", basePrice: 250, minimumVisitCharge: 150, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-hh3", categoryId: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea", title: "Clothes Washing & Folding", description: "Machine/hand wash assistance, clothes drying and folding", basePrice: 250, minimumVisitCharge: 200, priceUnit: "per_visit", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-hh4", categoryId: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea", title: "Full-Day Domestic Assistance", description: "8-hour comprehensive domestic household support", basePrice: 650, minimumVisitCharge: 400, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-hh5", categoryId: "f106c3b4-bdd2-4c05-9b01-d63ecae29dea", title: "Other Domestic Help", description: "Custom domestic helper tasks requiring confirmation", basePrice: 250, minimumVisitCharge: 200, priceUnit: "per_visit", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // WELDING (5 options)
    { id: "srv-wld1", categoryId: "3bd5ddac-31be-4163-807a-0a0871ed4161", title: "Gate & Grill Repair", description: "Iron gate hinge welding, safety grill reinforcement", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-wld2", categoryId: "3bd5ddac-31be-4163-807a-0a0871ed4161", title: "Balcony & Staircase Railing Fix", description: "Fixing loose MS/SS railings and balusters", basePrice: 450, minimumVisitCharge: 300, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-wld3", categoryId: "3bd5ddac-31be-4163-807a-0a0871ed4161", title: "Shed & Roof Truss Welding", description: "Corrugated sheet framework and truss welding", basePrice: 650, minimumVisitCharge: 400, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-wld4", categoryId: "3bd5ddac-31be-4163-807a-0a0871ed4161", title: "Custom Metal Fabrication", description: "Cutting, alignment & fabrication of iron/steel parts", basePrice: 600, minimumVisitCharge: 350, priceUnit: "per_hour", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-wld5", categoryId: "3bd5ddac-31be-4163-807a-0a0871ed4161", title: "Other Welding Work", description: "Custom welding or metal joining task", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_service", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // CONSTRUCTION LABOUR (5 options)
    { id: "srv-clb1", categoryId: "3fa324d5-3904-4d9a-b24a-3603d355834d", title: "Material Loading & Shifting", description: "Shifting sand, cement bags, bricks and tiles on site", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-clb2", categoryId: "3fa324d5-3904-4d9a-b24a-3603d355834d", title: "Earth Excavation & Trench Digging", description: "Manual digging for pipelines, foundations or gardening", basePrice: 550, minimumVisitCharge: 350, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-clb3", categoryId: "3fa324d5-3904-4d9a-b24a-3603d355834d", title: "Site Debris & Malba Removal", description: "Clearing construction rubble, broken plaster & debris", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-clb4", categoryId: "3fa324d5-3904-4d9a-b24a-3603d355834d", title: "Mason / Painter Helper", description: "Assisting senior artisans with mortar mixing & scaffolding", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_day", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-clb5", categoryId: "3fa324d5-3904-4d9a-b24a-3603d355834d", title: "Other Construction Labour", description: "Custom manual construction assistance task", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_day", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // TILE & FLOOR WORK (5 options)
    { id: "srv-tl1", categoryId: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef", title: "Floor Tile Laying & Replacement", description: "Vitrified and ceramic floor tile fixing and replacement", basePrice: 550, minimumVisitCharge: 350, priceUnit: "per_room", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-tl2", categoryId: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef", title: "Wall & Bathroom Tile Repair", description: "Fixing loose wall tiles and bathroom dado repair", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_wall", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-tl3", categoryId: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef", title: "Tile Grouting & Waterproof Sealing", description: "Epoxy and cement grouting to prevent water seepage", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_room", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-tl4", categoryId: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef", title: "Marble & Granite Edge Polishing", description: "Countertop edge rounding, diamond polishing & buffing", basePrice: 600, minimumVisitCharge: 350, priceUnit: "per_service", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "srv-tl5", categoryId: "1e73e7ac-f6da-45b9-9d6c-49d44ffa22ef", title: "Other Tile / Stone Work", description: "Custom flooring or stone restoration task", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service", isOther: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  async getCategories(): Promise<ServiceCategory[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("service_categories") as any)
        .select("*")
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || "",
          iconName: cat.icon_name || "Wrench",
          isActive: cat.is_active,
          createdAt: cat.created_at,
        }));
      }
    } catch (err) {
      console.warn("DB getCategories query notice:", err);
    }
    return this.categories.filter((c) => c.isActive);
  }

  async getServicesByCategory(categoryId: string): Promise<ServiceItem[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("services") as any)
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((srv: any) => ({
          id: srv.id,
          categoryId: srv.category_id,
          title: srv.title,
          description: srv.description || "",
          basePrice: srv.base_price || 350,
          minimumVisitCharge: srv.minimum_visit_charge || 200,
          priceUnit: srv.price_unit || "per_hour",
          isActive: srv.is_active,
          createdAt: srv.created_at,
          updatedAt: srv.updated_at,
        }));
      }
    } catch (err) {
      console.warn("DB getServicesByCategory query notice:", err);
    }

    let targetId = categoryId;
    if (categoryId === "cat-1") targetId = "cat-electrical";
    if (categoryId === "cat-2") targetId = "cat-plumbing";
    if (categoryId === "cat-3") targetId = "cat-cleaning";

    const matched = this.services.filter((s) => s.categoryId === targetId && s.isActive);
    if (matched.length > 0) return matched;
    return this.services.filter((s) => s.isActive);
  }

  async getServiceDetails(serviceId: string): Promise<ServiceItem | null> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("services") as any)
        .select("*")
        .eq("id", serviceId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          categoryId: data.category_id,
          title: data.title,
          description: data.description || "",
          basePrice: data.base_price || 350,
          minimumVisitCharge: data.minimum_visit_charge || 200,
          priceUnit: data.price_unit || "per_hour",
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("DB getServiceDetails query notice:", err);
    }
    return this.services.find((s) => s.id === serviceId) || null;
  }

  async getAllActiveServices(): Promise<ServiceItem[]> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("services") as any)
        .select("*")
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((srv: any) => ({
          id: srv.id,
          categoryId: srv.category_id,
          title: srv.title,
          description: srv.description || "",
          basePrice: srv.base_price || 350,
          minimumVisitCharge: srv.minimum_visit_charge || 200,
          priceUnit: srv.price_unit || "per_hour",
          isActive: srv.is_active,
          createdAt: srv.created_at,
          updatedAt: srv.updated_at,
        }));
      }
    } catch (err) {
      console.warn("DB getAllActiveServices query notice:", err);
    }
    return this.services.filter((s) => s.isActive);
  }
}

export const serviceCatalogService = new ServiceCatalogService();
