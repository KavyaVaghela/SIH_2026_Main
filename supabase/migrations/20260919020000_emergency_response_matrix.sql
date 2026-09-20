-- ====================================================================
-- EMERGENCY SERVICES: EMERGENCY RESPONSE MATRIX
-- Migration: 20260919020000_emergency_response_matrix.sql
-- Description: Deterministic, predefined Emergency Response Matrix
-- ====================================================================

-- 1. Create emergency_response_matrix table
CREATE TABLE IF NOT EXISTS public.emergency_response_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matrix_code VARCHAR(50) NOT NULL UNIQUE,
  category_name VARCHAR(100) NOT NULL,
  emergency_type VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_worker_count INTEGER NOT NULL DEFAULT 1,
  worker_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  team_lead_required BOOLEAN NOT NULL DEFAULT false,
  initial_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  federation_involvement_required BOOLEAN NOT NULL DEFAULT false,
  safety_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_emergency_response_matrix_code 
  ON public.emergency_response_matrix(matrix_code);

CREATE INDEX IF NOT EXISTS idx_emergency_response_matrix_type 
  ON public.emergency_response_matrix(emergency_type);

CREATE INDEX IF NOT EXISTS idx_emergency_response_matrix_category 
  ON public.emergency_response_matrix(category_name);

-- 3. Add response_matrix_code integration to emergency_incidents table if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'emergency_incidents' 
      AND column_name = 'response_matrix_code'
  ) THEN
    ALTER TABLE public.emergency_incidents 
      ADD COLUMN response_matrix_code VARCHAR(50) REFERENCES public.emergency_response_matrix(matrix_code) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Enable Row Level Security
ALTER TABLE public.emergency_response_matrix ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DO $$
BEGIN
  -- SELECT Policy: Public read access for active matrix configurations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_matrix' AND policyname = 'emergency_response_matrix_select_policy'
  ) THEN
    CREATE POLICY "emergency_response_matrix_select_policy"
      ON public.emergency_response_matrix FOR SELECT
      USING (is_active = true OR public.is_super_admin() OR auth.role() = 'service_role');
  END IF;

  -- INSERT Policy: Super Admins and service_role ONLY. Customers strictly forbidden.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_matrix' AND policyname = 'emergency_response_matrix_insert_policy'
  ) THEN
    CREATE POLICY "emergency_response_matrix_insert_policy"
      ON public.emergency_response_matrix FOR INSERT
      WITH CHECK (public.is_super_admin() OR auth.role() = 'service_role');
  END IF;

  -- UPDATE Policy: Super Admins and service_role ONLY. Customers strictly forbidden.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_matrix' AND policyname = 'emergency_response_matrix_update_policy'
  ) THEN
    CREATE POLICY "emergency_response_matrix_update_policy"
      ON public.emergency_response_matrix FOR UPDATE
      USING (public.is_super_admin() OR auth.role() = 'service_role');
  END IF;

  -- DELETE Policy: Super Admins and service_role ONLY. Customers strictly forbidden.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_matrix' AND policyname = 'emergency_response_matrix_delete_policy'
  ) THEN
    CREATE POLICY "emergency_response_matrix_delete_policy"
      ON public.emergency_response_matrix FOR DELETE
      USING (public.is_super_admin() OR auth.role() = 'service_role');
  END IF;
END $$;

-- 6. Seed Deterministic Predefined Emergency Response Matrix
INSERT INTO public.emergency_response_matrix (
  matrix_code,
  category_name,
  emergency_type,
  description,
  severity,
  required_skills,
  recommended_worker_count,
  worker_roles,
  team_lead_required,
  initial_tasks,
  federation_involvement_required,
  safety_requirements,
  is_active
) VALUES
  -- 1. Water Infrastructure: Society Water Tank Burst (Concrete reference from workflow)
  (
    'wat-tank-burst',
    'Water Infrastructure',
    'Society Water Tank Burst',
    'Overhead or underground community water tank structural rupture flooding premises.',
    'CRITICAL',
    '["Plumbing", "Water infrastructure", "Pump operation", "Electrical safety"]'::jsonb,
    6,
    '[
      {"role": "Team Lead", "count": 1, "skill": "Plumbing / Incident Coordination"},
      {"role": "Plumber", "count": 3, "skill": "Plumbing"},
      {"role": "Water Technician", "count": 1, "skill": "Water infrastructure / Pump operation"},
      {"role": "Electrician", "count": 1, "skill": "Electrical safety"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Main Riser Isolation", "instruction": "Locate and shut off primary intake and booster riser valves immediately."},
      {"order": 2, "title": "Pump Substation Power Cutoff", "instruction": "De-energize pump room distribution panel to eliminate electrocution hazard."},
      {"order": 3, "title": "Structural & Drainage Perimeter Check", "instruction": "Inspect foundation walls, basement conduits, and clear storm drains."},
      {"order": 4, "title": "Deploy Dewatering Submersible Pump", "instruction": "Deploy heavy-duty submersible dewatering pump to evacuate standing water."}
    ]'::jsonb,
    true,
    '["De-energize electrical sub-panel near flooded area", "Wear rubberized safety boots and insulated gloves", "Cordon off unstable structural perimeter"]'::jsonb,
    true
  ),
  -- 2. Water Infrastructure: Main Water Supply Line Rupture
  (
    'wat-pipe-rupture',
    'Water Infrastructure',
    'Main Water Supply Line Rupture',
    'High-pressure municipal or building riser pipe burst causing uncontrolled flooding.',
    'HIGH',
    '["Plumbing", "Water infrastructure", "Pipe fitting"]'::jsonb,
    3,
    '[
      {"role": "Team Lead", "count": 1, "skill": "Plumbing / High-Pressure Lines"},
      {"role": "Plumber", "count": 2, "skill": "Plumbing / Pipe Fitting"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Shut Off Sluice Valve", "instruction": "Isolate the municipal inlet sluice valve to stop high-pressure inflow."},
      {"order": 2, "title": "Pressure Relief", "instruction": "Open lowest drain valves to bleed residual line pressure."},
      {"order": 3, "title": "Pipe Section Clamping", "instruction": "Apply mechanical compression repair clamp or replacement pipe spool."}
    ]'::jsonb,
    false,
    '["Maintain safe distance from high-velocity water jet", "Isolate nearby ground junction boxes"]'::jsonb,
    true
  ),
  -- 3. Water Infrastructure: Severe Drainage / Sewage Backup
  (
    'wat-drain-backup',
    'Water Infrastructure',
    'Severe Drainage / Sewage Backup',
    'Critical sewer line blockage causing wastewater overflow into residential areas.',
    'HIGH',
    '["Drainage clearing", "Jetting machine operation", "Bio-sanitation"]'::jsonb,
    2,
    '[
      {"role": "Drainage Technician", "count": 2, "skill": "Drainage clearing / Jetting machine operation"}
    ]'::jsonb,
    false,
    '[
      {"order": 1, "title": "Sewer Manhole Inspection", "instruction": "Open downstream inspection chamber to locate blockage point."},
      {"order": 2, "title": "Deploy High-Pressure Jetting Rod", "instruction": "Insert jetting head to clear grease, roots, or physical obstruction."},
      {"order": 3, "title": "Sanitary Disinfection", "instruction": "Apply bio-neutralizer spray over affected surface area."}
    ]'::jsonb,
    false,
    '["Wear biological hazard suit, gas mask, and nitrile gloves", "Ventilate sewer gases (H2S/methane)"]'::jsonb,
    true
  ),
  -- 4. Electrical Systems: Electrical Short Circuit & Sparking
  (
    'elec-short-spark',
    'Electrical Systems',
    'Electrical Short Circuit & Sparking',
    'Active electrical arcing, burning wire smell, or failure of breaker to trip.',
    'CRITICAL',
    '["Electrical safety", "Arc fault isolation", "Cable jointing"]'::jsonb,
    2,
    '[
      {"role": "Team Lead / Senior Electrician", "count": 1, "skill": "Electrical safety / Diagnostic isolation"},
      {"role": "Electrician", "count": 1, "skill": "Cable jointing / Panel maintenance"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Upstream Breaker Trip", "instruction": "Locate and isolate upstream main breaker or fuse switch immediately."},
      {"order": 2, "title": "Thermal Scan & Arc Source Trace", "instruction": "Use non-contact infrared scanner to identify scorched cable section."},
      {"order": 3, "title": "Dielectric Test & Jointing", "instruction": "Strip melted insulation, verify zero voltage, and install heat-shrink splice."}
    ]'::jsonb,
    true,
    '["Never use water on electrical fire", "Use Class C / CO2 extinguisher only", "Verify zero energy state with calibrated multimeter"]'::jsonb,
    true
  ),
  -- 5. Electrical Systems: Substation / Main Panel Failure
  (
    'elec-substation-fail',
    'Electrical Systems',
    'Substation / Main Panel Failure',
    'Central distribution panel burnout, busbar failure, or phase drop.',
    'HIGH',
    '["High-voltage systems", "Busbar maintenance", "Phase load balancing"]'::jsonb,
    3,
    '[
      {"role": "Team Lead / Electrical Engineer", "count": 1, "skill": "High-voltage systems / Panel diagnostics"},
      {"role": "Certified Electrician", "count": 2, "skill": "Busbar maintenance / Cable termination"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Lock-Out Tag-Out (LOTO)", "instruction": "Engage mechanical padlock and tag on primary transformer circuit breaker."},
      {"order": 2, "title": "Busbar Chamber Inspection", "instruction": "Inspect phase separation insulators and busbar couplers for flashover."},
      {"order": 3, "title": "Phase Continuity Testing", "instruction": "Measure 3-phase resistance across terminal lugs before re-energizing."}
    ]'::jsonb,
    true,
    '["Mandatory 1000V rated insulated gloves and face shield", "Observe Lock-Out Tag-Out protocols"]'::jsonb,
    true
  ),
  -- 6. Electrical Systems: Total Building Power Blackout
  (
    'elec-blackout',
    'Electrical Systems',
    'Total Building Power Blackout',
    'Sudden complete loss of electricity affecting essential infrastructure (pumps, lifts).',
    'HIGH',
    '["Generator maintenance", "ATS diagnostics", "Power distribution"]'::jsonb,
    2,
    '[
      {"role": "Electrician", "count": 1, "skill": "Power distribution"},
      {"role": "DG Specialist", "count": 1, "skill": "Generator maintenance / ATS diagnostics"}
    ]'::jsonb,
    false,
    '[
      {"order": 1, "title": "Grid vs Internal Fault Determination", "instruction": "Check municipal distribution feeder status to isolate grid fault."},
      {"order": 2, "title": "Emergency Generator Inspection", "instruction": "Verify DG set auto-crank battery, fuel line, and ATS contactor position."},
      {"order": 3, "title": "Manual ATS Transfer", "instruction": "Manually throw bypass switch if automatic transfer solenoid stalled."}
    ]'::jsonb,
    false,
    '["Ensure emergency lighting is activated", "Keep pump and elevator emergency lines prioritized"]'::jsonb,
    true
  ),
  -- 7. Gas & Fire Hazard: Piped Gas Leakage
  (
    'gas-piped-leak',
    'Gas & Fire Hazard',
    'Piped Gas Leakage',
    'Strong domestic or riser piped natural gas (PNG) odor requiring emergency isolation.',
    'CRITICAL',
    '["Gas safety", "PNG line isolation", "Combustible gas sniffing"]'::jsonb,
    3,
    '[
      {"role": "Team Lead", "count": 1, "skill": "Gas safety / Emergency isolation"},
      {"role": "Certified Gas Fitter", "count": 2, "skill": "PNG line isolation / Leak detection"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Master Gas Valve Shutoff", "instruction": "Immediately turn off building riser master yellow-handle emergency valve."},
      {"order": 2, "title": "Extinguish Open Flames & Ventilation", "instruction": "Do not operate electrical switches. Open windows and doors for natural ventilation."},
      {"order": 3, "title": "Calibrated Gas Sniffer Survey", "instruction": "Scan pipeline joints with digital combustible detector to pinpoint breach."}
    ]'::jsonb,
    true,
    '["DO NOT turn ON/OFF any electrical light or fan switches", "No mobile phones or spark sources near leakage zone", "Evacuate building occupants if gas level > 10% LEL"]'::jsonb,
    true
  ),
  -- 8. Gas & Fire Hazard: Cylinder Regulator Hazard
  (
    'gas-regulator-fail',
    'Gas & Fire Hazard',
    'Cylinder Regulator Hazard',
    'LPG cylinder valve leak or defective high-pressure regulator refusing shutoff.',
    'CRITICAL',
    '["LPG handling", "Regulator repair", "Fire safety"]'::jsonb,
    1,
    '[
      {"role": "Gas Appliance Technician", "count": 1, "skill": "LPG handling / Regulator repair"}
    ]'::jsonb,
    false,
    '[
      {"order": 1, "title": "Regulator Release & Safety Cap", "instruction": "Pull up collar to detach defective regulator; snap black plastic safety cap on cylinder valve."},
      {"order": 2, "title": "Move Cylinder to Open Atmosphere", "instruction": "Carefully move leaking cylinder to open-air balcony or outdoor compound."},
      {"order": 3, "title": "Bubble Leak Check", "instruction": "Apply soap solution on valve seat to confirm seal integrity."}
    ]'::jsonb,
    false,
    '["Keep wet burlap or safety blanket nearby", "Ensure zero flame or sparks in vicinity"]'::jsonb,
    true
  ),
  -- 9. Gas & Fire Hazard: Smoke / Electrical Fire Alarm
  (
    'gas-electrical-smoke',
    'Gas & Fire Hazard',
    'Smoke / Electrical Fire Alarm',
    'Dense electrical smoke emerging from service shafts or ceiling conduit.',
    'CRITICAL',
    '["Fire safety", "Electrical isolation", "Smoke evacuation"]'::jsonb,
    3,
    '[
      {"role": "Team Lead", "count": 1, "skill": "Fire safety / Incident control"},
      {"role": "Fire Safety Technician", "count": 1, "skill": "Fire fighting / Smoke evacuation"},
      {"role": "Electrician", "count": 1, "skill": "Electrical isolation"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Activate Alarm & Evacuate Shaft Zone", "instruction": "Trigger manual fire call point and alert floor occupants."},
      {"order": 2, "title": "Cut Electrical Infeed to Shaft", "instruction": "De-energize main electrical infeed serving the smoking riser."},
      {"order": 3, "title": "CO2 Suppression & Thermal Check", "instruction": "Discharge dry chemical / CO2 extinguisher into shaft access hatch."}
    ]'::jsonb,
    true,
    '["Wear smoke-filtering respirator mask", "Do not use elevators during smoke warning", "Stay low beneath smoke ceiling"]'::jsonb,
    true
  ),
  -- 10. Structural & Security: Emergency Door Lockout
  (
    'sec-door-lockout',
    'Structural & Security',
    'Emergency Door Lockout',
    'Main safety door jammed or broken key with vulnerable occupants or children inside.',
    'HIGH',
    '["Lock picking", "Digital lock override", "Door hardware"]'::jsonb,
    1,
    '[
      {"role": "Certified Locksmith", "count": 1, "skill": "Lock picking / Non-destructive entry"}
    ]'::jsonb,
    false,
    '[
      {"order": 1, "title": "Occupant Safety & Welfare Assessment", "instruction": "Communicate through door to verify condition of occupants inside."},
      {"order": 2, "title": "Non-Destructive Bypass Attempt", "instruction": "Attempt tension pick or cylinder decoder bypass on primary lock."},
      {"order": 3, "title": "Controlled Cylinder Extraction", "instruction": "If jammed, pull lock core cleanly to unlock deadbolt without door damage."}
    ]'::jsonb,
    false,
    '["Verify customer identity and tenancy documentation", "Avoid uncoordinated forced entry causing glass shatter"]'::jsonb,
    true
  ),
  -- 11. Structural & Security: Structural Collapse / Slab Damage
  (
    'sec-slab-damage',
    'Structural & Security',
    'Structural Collapse / Slab Damage',
    'Spalling concrete, cracked support lintel, or ceiling plaster collapse threatening injury.',
    'CRITICAL',
    '["Structural shoring", "Masonry", "Emergency props"]'::jsonb,
    3,
    '[
      {"role": "Structural Team Lead", "count": 1, "skill": "Structural shoring / Load assessment"},
      {"role": "Masonry / Propping Specialist", "count": 2, "skill": "Emergency props / Debris stabilization"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Cordon Danger Footprint", "instruction": "Establish 5-meter exclusion boundary tape around falling debris area."},
      {"order": 2, "title": "Install Heavy-Duty Steel Acrow Props", "instruction": "Erect telescopic screw props with baseplates beneath deflecting ceiling slab."},
      {"order": 3, "title": "Load Transfer & Deflection Monitoring", "instruction": "Tighten prop pins to arrest ongoing structural subsidence."}
    ]'::jsonb,
    true,
    '["Wear hard hats and steel-toe boots at all times", "Never step directly under cracked cantilever slab"]'::jsonb,
    true
  ),
  -- 12. Structural & Security: Elevator Failure / Entrapment
  (
    'sec-elevator-trap',
    'Structural & Security',
    'Elevator Failure / Entrapment',
    'Building lift stalled between floors with trapped occupants requiring certified extrication.',
    'CRITICAL',
    '["Elevator mechanics", "Manual brake release", "Passenger extrication"]'::jsonb,
    2,
    '[
      {"role": "Certified Lift Technician (Team Lead)", "count": 1, "skill": "Elevator mechanics / Brake release"},
      {"role": "Lift Assistant", "count": 1, "skill": "Passenger extrication / Door unlocking"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Intercom Contact & Reassurance", "instruction": "Establish communication with passengers, instruct them to step back from doors."},
      {"order": 2, "title": "Machine Room Power Isolation", "instruction": "Switch off lift 3-phase supply breaker to prevent sudden motor startup."},
      {"order": 3, "title": "Manual Brake Release & Leveling", "instruction": "Manually lift brake lever and wind flywheel until car aligns with floor landing sill."},
      {"order": 4, "title": "Drop-Key Landing Door Unlock", "instruction": "Insert emergency drop key into header hatch to open doors and assist passengers out."}
    ]'::jsonb,
    true,
    '["Never attempt door pry until drive power is isolated", "Verify cabin floor is level with landing sill before passenger exit"]'::jsonb,
    true
  ),
  -- 13. Sanitation & Biohazard: Severe Chemical / Hazardous Waste Spillage
  (
    'san-chemical-spill',
    'Sanitation & Biohazard',
    'Severe Chemical / Hazardous Waste Spillage',
    'Industrial acid, chlorine, or caustic cleaning agent spill generating toxic fumes.',
    'HIGH',
    '["Hazardous material handling", "Chemical neutralization", "Respiratory PPE"]'::jsonb,
    2,
    '[
      {"role": "Biohazard Specialist", "count": 2, "skill": "Hazardous material handling / Chemical neutralization"}
    ]'::jsonb,
    false,
    '[
      {"order": 1, "title": "Establish Vapor Perimeter", "instruction": "Evacuate downwind corridor and set up chemical hazard signage."},
      {"order": 2, "title": "Deploy Neutralizing Absorbent Boom", "instruction": "Encircle liquid pool with sodium bicarbonate or absorbent chemical socks."},
      {"order": 3, "title": "Collect Waste in Sealed Hazmat Drums", "instruction": "Scoop spent neutralized slurry into UN-rated yellow waste containers."}
    ]'::jsonb,
    true,
    '["Must wear chemical splash apron, full-face respirator, and heavy butyl gloves", "Do not rinse corrosive chemicals down public storm drains"]'::jsonb,
    true
  ),
  -- 14. Sanitation & Biohazard: Contaminated Community Water Supply
  (
    'san-water-contam',
    'Sanitation & Biohazard',
    'Contaminated Community Water Supply',
    'Sewage cross-contamination or chemical ingress into domestic drinking water line.',
    'CRITICAL',
    '["Water chlorination", "Tank decontamination", "Plumbing cross-connection"]'::jsonb,
    3,
    '[
      {"role": "Water Quality Specialist (Team Lead)", "count": 1, "skill": "Water chlorination / Contamination tracing"},
      {"role": "Tank Decontamination Technician", "count": 2, "skill": "Tank decontamination / High-pressure washing"}
    ]'::jsonb,
    true,
    '[
      {"order": 1, "title": "Lock Consumer Distribution Outlets", "instruction": "Lock society distribution valves and notify residents not to drink or use tap water."},
      {"order": 2, "title": "Drain Sump & Locate Ingress Point", "instruction": "Pump out contaminated water; inspect tank walls for sewage pipe infiltration."},
      {"order": 3, "title": "Hyper-Chlorination & Shock Treatment", "instruction": "Apply 50 ppm calcium hypochlorite wash across all tank surfaces, soak, and flush."}
    ]'::jsonb,
    true,
    '["Wear protective gas masks when handling concentrated hypochlorite", "Perform water test before re-authorizing potable use"]'::jsonb,
    true
  )
ON CONFLICT (matrix_code) DO UPDATE SET
  category_name = EXCLUDED.category_name,
  emergency_type = EXCLUDED.emergency_type,
  description = EXCLUDED.description,
  severity = EXCLUDED.severity,
  required_skills = EXCLUDED.required_skills,
  recommended_worker_count = EXCLUDED.recommended_worker_count,
  worker_roles = EXCLUDED.worker_roles,
  team_lead_required = EXCLUDED.team_lead_required,
  initial_tasks = EXCLUDED.initial_tasks,
  federation_involvement_required = EXCLUDED.federation_involvement_required,
  safety_requirements = EXCLUDED.safety_requirements,
  is_active = EXCLUDED.is_active,
  updated_at = now();
