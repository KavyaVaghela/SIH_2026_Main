-- ====================================================================
-- KAUSHALYASETU EMERGENCY SERVICES: COMPLETE MIGRATION SCRIPT (TASKS 1-8)
-- Generated for Remote Supabase Execution
-- Database Target: dxvnwbmxeubpbunwlmnd
-- ====================================================================


-- --------------------------------------------------------------------
-- START OF 20260919000000_emergency_priority.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- EMERGENCY SERVICES: 3-LEVEL PRIORITY SELECTION
-- Migration: 20260919000000_emergency_priority.sql
-- Description: Adds priority column to bookings table for emergency dispatch
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'emergency_priority') THEN
    CREATE TYPE emergency_priority AS ENUM ('LOW', 'MODERATE', 'HIGH');
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'LOW';

CREATE INDEX IF NOT EXISTS idx_bookings_priority
  ON public.bookings(priority);


-- --------------------------------------------------------------------
-- END OF 20260919000000_emergency_priority.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260919010000_emergency_incidents_foundation.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- EMERGENCY SERVICES: INCIDENT FOUNDATION
-- Migration: 20260919010000_emergency_incidents_foundation.sql
-- Description: Independent Emergency Incident operational entity, decoupled from bookings
-- ====================================================================

-- 1. Create emergency_incidents table
CREATE TABLE IF NOT EXISTS public.emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id VARCHAR(32) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  federation_id UUID REFERENCES public.federations(id) ON DELETE SET NULL,
  category_name VARCHAR(100) NOT NULL,
  emergency_type VARCHAR(150) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_RESPONSE' CHECK (
    status IN (
      'AWAITING_RESPONSE',
      'DISPATCHING',
      'TEAM_FORMING',
      'ACTIVE',
      'STAFFING_SHORTAGE',
      'RESOLVED',
      'CLOSED',
      'CANCELLED'
    )
  ),
  location TEXT NOT NULL,
  address_details JSONB DEFAULT '{}'::jsonb,
  description TEXT NOT NULL,
  evidence_photos TEXT[] DEFAULT '{}'::text[],
  approx_people_affected INTEGER DEFAULT 1,
  immediate_danger BOOLEAN DEFAULT false,
  danger_details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Indexes for fast retrieval and filtering
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_emergency_id 
  ON public.emergency_incidents(emergency_id);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_customer_id 
  ON public.emergency_incidents(customer_id);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status 
  ON public.emergency_incidents(status);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_created_at 
  ON public.emergency_incidents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_federation_id 
  ON public.emergency_incidents(federation_id);

-- 3. Enable Row Level Security
ALTER TABLE public.emergency_incidents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
  -- SELECT Policy: Super Admins, service_role, incident reporter (Customer), or Federation Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_select_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_select_policy"
      ON public.emergency_incidents FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        customer_id = auth.uid() OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;

  -- INSERT Policy: Authenticated customers can insert incidents for themselves, initial status must be AWAITING_RESPONSE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_insert_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_insert_policy"
      ON public.emergency_incidents FOR INSERT
      WITH CHECK (
        auth.role() = 'service_role' OR
        (
          auth.role() = 'authenticated' AND
          customer_id = auth.uid() AND
          status = 'AWAITING_RESPONSE'
        )
      );
  END IF;

  -- UPDATE Policy: Super Admins and Federation Admins only. Customers CANNOT alter incidents or change status.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_update_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_update_policy"
      ON public.emergency_incidents FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;

  -- DELETE Policy: Super Admin and service_role only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_delete_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_delete_policy"
      ON public.emergency_incidents FOR DELETE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;
END $$;

-- 5. Realtime Publication configuration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_incidents') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_incidents;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260919010000_emergency_incidents_foundation.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260919020000_emergency_response_matrix.sql
-- --------------------------------------------------------------------

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


-- --------------------------------------------------------------------
-- END OF 20260919020000_emergency_response_matrix.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260919030000_emergency_dispatch_pool.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- EMERGENCY SERVICES: EMERGENCY DISPATCH POOL
-- Migration: 20260919030000_emergency_dispatch_pool.sql
-- Description: Deterministic Worker Eligibility & Dispatch Pool
-- ====================================================================

-- 1. Create emergency_dispatch_pool table
CREATE TABLE IF NOT EXISTS public.emergency_dispatch_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE RESTRICT,
  required_role VARCHAR(100) NOT NULL,
  matched_skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  eligibility_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  eligibility_reasons JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'DISPATCHED' CHECK (
    status IN ('CANDIDATE', 'DISPATCHED', 'EXPIRED', 'WITHDRAWN')
  ),
  offered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  responded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_dispatch_pool_incident_worker UNIQUE (incident_id, worker_id)
);

-- 2. Indexes for fast retrieval and filtering
CREATE INDEX IF NOT EXISTS idx_dispatch_pool_incident_id 
  ON public.emergency_dispatch_pool(incident_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_worker_id 
  ON public.emergency_dispatch_pool(worker_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_status 
  ON public.emergency_dispatch_pool(status);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_federation_id 
  ON public.emergency_dispatch_pool(federation_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_offered_at 
  ON public.emergency_dispatch_pool(offered_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.emergency_dispatch_pool ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
  -- SELECT Policy:
  -- - Super Admin or service_role can view all
  -- - Workers can only view opportunities dispatched to themselves
  -- - Federation Admin can view records within their federation
  -- - Customer who reported the incident can view dispatch status of their incident (read-only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_select_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_select_policy"
      ON public.emergency_dispatch_pool FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid())
      );
  END IF;

  -- INSERT Policy: Super Admin, service_role, or system dispatch
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_insert_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_insert_policy"
      ON public.emergency_dispatch_pool FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;

  -- UPDATE Policy: Super Admin, service_role, or Federation Admin. Customers strictly forbidden.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_update_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_update_policy"
      ON public.emergency_dispatch_pool FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;

  -- DELETE Policy: Super Admin and service_role only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_delete_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_delete_policy"
      ON public.emergency_dispatch_pool FOR DELETE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;
END $$;

-- 5. Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_dispatch_pool;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260919030000_emergency_dispatch_pool.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260919040000_emergency_response_teams.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- EMERGENCY SERVICES: REALTIME WORKER ACCEPT/DECLINE & RESPONSE TEAM FORMATION
-- Migration: 20260919040000_emergency_response_teams.sql
-- Description: Team and team member schema, atomic worker acceptance RPC, and RLS
-- ====================================================================

-- 1. Update emergency_dispatch_pool status check constraint to include ACCEPTED and DECLINED
DO $$
BEGIN
  ALTER TABLE public.emergency_dispatch_pool 
    DROP CONSTRAINT IF EXISTS emergency_dispatch_pool_status_check;

  ALTER TABLE public.emergency_dispatch_pool
    ADD CONSTRAINT emergency_dispatch_pool_status_check
    CHECK (status IN ('CANDIDATE', 'DISPATCHED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update notice: %', SQLERRM;
END $$;

-- 2. Create emergency_response_teams table
CREATE TABLE IF NOT EXISTS public.emergency_response_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'FORMED' CHECK (
    status IN ('FORMING', 'FORMED', 'ACTIVE', 'STANDBY', 'DISBANDED')
  ),
  team_lead_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  requires_team_lead BOOLEAN NOT NULL DEFAULT false,
  required_worker_count INTEGER NOT NULL DEFAULT 1,
  accepted_worker_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_emergency_response_teams_incident UNIQUE (incident_id)
);

-- 3. Create emergency_response_team_members table
CREATE TABLE IF NOT EXISTS public.emergency_response_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  is_team_lead BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED' CHECK (
    status IN ('ASSIGNED', 'ACTIVE', 'STANDBY', 'RELEASED')
  ),
  accepted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_team_members_team_worker UNIQUE (team_id, worker_id),
  CONSTRAINT uk_team_members_incident_worker UNIQUE (incident_id, worker_id)
);

-- 4. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_emergency_teams_incident_id 
  ON public.emergency_response_teams(incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_teams_federation_id 
  ON public.emergency_response_teams(federation_id);

CREATE INDEX IF NOT EXISTS idx_emergency_teams_status 
  ON public.emergency_response_teams(status);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_team_id 
  ON public.emergency_response_team_members(team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_worker_id 
  ON public.emergency_response_team_members(worker_id);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_incident_id 
  ON public.emergency_response_team_members(incident_id);

-- 5. Stored Procedure: Atomic Worker Response & Team Formation
CREATE OR REPLACE FUNCTION public.respond_to_emergency_dispatch(
  p_dispatch_id UUID,
  p_worker_id UUID,
  p_response VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispatch RECORD;
  v_incident RECORD;
  v_matrix RECORD;
  v_accepted_count INTEGER;
  v_required_count INTEGER;
  v_team_id UUID;
  v_team_lead_id UUID;
  v_requires_team_lead BOOLEAN;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Validate response parameter
  IF p_response NOT IN ('ACCEPT', 'DECLINE') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 400,
      'error', 'Invalid response action. Must be ACCEPT or DECLINE.'
    );
  END IF;

  -- 2. Check and lock dispatch row
  SELECT id, incident_id, worker_id, federation_id, required_role, status, matched_skills
  INTO v_dispatch
  FROM public.emergency_dispatch_pool
  WHERE id = p_dispatch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 404,
      'error', 'Emergency dispatch record not found.'
    );
  END IF;

  -- 3. Verify worker authorization
  IF v_dispatch.worker_id <> p_worker_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 403,
      'error', 'Unauthorized: Worker may only respond to opportunities dispatched to themselves.'
    );
  END IF;

  -- 4. Check if already responded
  IF v_dispatch.status = 'ACCEPTED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'You have already accepted this emergency opportunity.'
    );
  END IF;

  IF v_dispatch.status = 'DECLINED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'You have already declined this emergency opportunity.'
    );
  END IF;

  IF v_dispatch.status IN ('EXPIRED', 'WITHDRAWN') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 410,
      'error', 'This emergency opportunity is no longer available (status: ' || v_dispatch.status || ').'
    );
  END IF;

  -- 5. Branch: Worker DECLINE
  IF p_response = 'DECLINE' THEN
    UPDATE public.emergency_dispatch_pool
    SET status = 'DECLINED',
        responded_at = v_now,
        updated_at = v_now
    WHERE id = v_dispatch.id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 200,
      'status', 'DECLINED',
      'dispatch_id', v_dispatch.id,
      'incident_id', v_dispatch.incident_id,
      'responded_at', v_now
    );
  END IF;

  -- 6. Branch: Worker ACCEPT (requires atomic staffing check)
  -- Check and lock the incident row
  SELECT id, emergency_id, federation_id, emergency_type, status
  INTO v_incident
  FROM public.emergency_incidents
  WHERE id = v_dispatch.incident_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 404,
      'error', 'Emergency incident associated with dispatch not found.'
    );
  END IF;

  IF v_incident.status IN ('RESOLVED', 'CLOSED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'Emergency incident has already been resolved or closed.'
    );
  END IF;

  -- Resolve Response Matrix for this incident
  SELECT recommended_worker_count, requires_team_lead, worker_roles
  INTO v_matrix
  FROM public.emergency_response_matrix
  WHERE emergency_type = v_incident.emergency_type;

  IF FOUND THEN
    v_required_count := COALESCE(v_matrix.recommended_worker_count, 1);
    v_requires_team_lead := COALESCE(v_matrix.requires_team_lead, false);
  ELSE
    v_required_count := 1;
    v_requires_team_lead := false;
  END IF;

  -- Count currently accepted workers for this incident
  SELECT count(*) INTO v_accepted_count
  FROM public.emergency_dispatch_pool
  WHERE incident_id = v_incident.id AND status = 'ACCEPTED';

  -- Check if slot capacity is already filled
  IF v_accepted_count >= v_required_count THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'Staffing capacity for this emergency incident has already been fulfilled.',
      'required_count', v_required_count,
      'accepted_count', v_accepted_count
    );
  END IF;

  -- Mark current worker dispatch as ACCEPTED
  UPDATE public.emergency_dispatch_pool
  SET status = 'ACCEPTED',
      responded_at = v_now,
      updated_at = v_now
  WHERE id = v_dispatch.id;

  v_accepted_count := v_accepted_count + 1;

  -- 7. Team Formation Check
  IF v_accepted_count >= v_required_count THEN
    -- Required staffing is completely fulfilled! Create/Form the Emergency Response Team
    
    -- Deterministic Team Lead Identification
    -- Check if any accepted worker has required_role matching Team Lead
    SELECT worker_id INTO v_team_lead_id
    FROM public.emergency_dispatch_pool
    WHERE incident_id = v_incident.id 
      AND status = 'ACCEPTED'
      AND (required_role ILIKE '%team lead%' OR required_role ILIKE '%lead%')
    LIMIT 1;

    -- Upsert Team record
    INSERT INTO public.emergency_response_teams (
      incident_id,
      federation_id,
      status,
      team_lead_worker_id,
      requires_team_lead,
      required_worker_count,
      accepted_worker_count,
      created_at,
      updated_at
    ) VALUES (
      v_incident.id,
      COALESCE(v_incident.federation_id, v_dispatch.federation_id),
      'FORMED',
      v_team_lead_id,
      v_requires_team_lead,
      v_required_count,
      v_accepted_count,
      v_now,
      v_now
    )
    ON CONFLICT (incident_id) DO UPDATE
    SET status = 'FORMED',
        team_lead_worker_id = EXCLUDED.team_lead_worker_id,
        accepted_worker_count = EXCLUDED.accepted_worker_count,
        updated_at = v_now
    RETURNING id INTO v_team_id;

    -- Insert all accepted workers into emergency_response_team_members
    INSERT INTO public.emergency_response_team_members (
      team_id,
      incident_id,
      worker_id,
      role,
      is_team_lead,
      status,
      accepted_at,
      created_at,
      updated_at
    )
    SELECT
      v_team_id,
      v_incident.id,
      edp.worker_id,
      edp.required_role,
      (edp.worker_id = v_team_lead_id),
      'ASSIGNED',
      COALESCE(edp.responded_at, v_now),
      v_now,
      v_now
    FROM public.emergency_dispatch_pool edp
    WHERE edp.incident_id = v_incident.id AND edp.status = 'ACCEPTED'
    ON CONFLICT (incident_id, worker_id) DO NOTHING;

    -- Transition Incident status to ACTIVE
    UPDATE public.emergency_incidents
    SET status = 'ACTIVE',
        updated_at = v_now
    WHERE id = v_incident.id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 200,
      'status', 'ACCEPTED',
      'dispatch_id', v_dispatch.id,
      'incident_id', v_incident.id,
      'team_formed', true,
      'team_id', v_team_id,
      'required_count', v_required_count,
      'accepted_count', v_accepted_count,
      'team_lead_worker_id', v_team_lead_id
    );
  ELSE
    -- Partial staffing: Team is NOT formed yet
    -- Update Incident status to TEAM_FORMING
    UPDATE public.emergency_incidents
    SET status = 'TEAM_FORMING',
        updated_at = v_now
    WHERE id = v_incident.id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 200,
      'status', 'ACCEPTED',
      'dispatch_id', v_dispatch.id,
      'incident_id', v_incident.id,
      'team_formed', false,
      'required_count', v_required_count,
      'accepted_count', v_accepted_count
    );
  END IF;
END;
$$;

-- 6. Enable Row Level Security
ALTER TABLE public.emergency_response_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_response_team_members ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: emergency_response_teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_teams' AND policyname = 'emergency_teams_select_policy'
  ) THEN
    CREATE POLICY "emergency_teams_select_policy"
      ON public.emergency_response_teams FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        id IN (
          SELECT team_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_teams' AND policyname = 'emergency_teams_insert_policy'
  ) THEN
    CREATE POLICY "emergency_teams_insert_policy"
      ON public.emergency_response_teams FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_teams' AND policyname = 'emergency_teams_update_policy'
  ) THEN
    CREATE POLICY "emergency_teams_update_policy"
      ON public.emergency_response_teams FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;
END $$;

-- 8. RLS Policies: emergency_response_team_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_team_members' AND policyname = 'emergency_team_members_select_policy'
  ) THEN
    CREATE POLICY "emergency_team_members_select_policy"
      ON public.emergency_response_team_members FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE federation_id = public.current_federation_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_team_members' AND policyname = 'emergency_team_members_insert_policy'
  ) THEN
    CREATE POLICY "emergency_team_members_insert_policy"
      ON public.emergency_response_team_members FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;
END $$;

-- 9. Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_response_teams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_response_teams;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_response_team_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_response_team_members;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260919040000_emergency_response_teams.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260919050000_emergency_tasks.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- EMERGENCY SERVICES: EMERGENCY TASKS & FIELD COORDINATION
-- Migration: 20260919050000_emergency_tasks.sql
-- Description: Persistent Incident Tasks, Team Lead Coordination, and Additional Worker Requests
-- ====================================================================

-- 1. Create emergency_incident_tasks table
CREATE TABLE IF NOT EXISTS public.emergency_incident_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  task_order INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  assigned_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  assigned_role VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  CONSTRAINT uk_emergency_tasks_incident_order UNIQUE (incident_id, task_order)
);

-- 2. Create emergency_additional_worker_requests table
CREATE TABLE IF NOT EXISTS public.emergency_additional_worker_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  requested_by_worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  requested_role VARCHAR(100) NOT NULL,
  requested_skill VARCHAR(100),
  requested_worker_count INTEGER NOT NULL DEFAULT 1 CHECK (requested_worker_count >= 1),
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING_FEDERATION_REVIEW' CHECK (
    status IN ('PENDING_FEDERATION_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')
  ),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Indexes for fast retrieval and query filtering
CREATE INDEX IF NOT EXISTS idx_emergency_tasks_incident_id 
  ON public.emergency_incident_tasks(incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_team_id 
  ON public.emergency_incident_tasks(team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_assigned_worker_id 
  ON public.emergency_incident_tasks(assigned_worker_id);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_status 
  ON public.emergency_incident_tasks(status);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_task_order 
  ON public.emergency_incident_tasks(incident_id, task_order);

CREATE INDEX IF NOT EXISTS idx_emergency_add_workers_incident_id 
  ON public.emergency_additional_worker_requests(incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_add_workers_team_id 
  ON public.emergency_additional_worker_requests(team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_add_workers_status 
  ON public.emergency_additional_worker_requests(status);

-- 4. Enable Row Level Security
ALTER TABLE public.emergency_incident_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_additional_worker_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: emergency_incident_tasks
DO $$
BEGIN
  -- SELECT: Team members, Team Lead, Incident Customer (read-only progress), Federation Admin, Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks' AND policyname = 'emergency_tasks_select_policy'
  ) THEN
    CREATE POLICY "emergency_tasks_select_policy"
      ON public.emergency_incident_tasks FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        team_id IN (
          SELECT team_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        ) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE federation_id = public.current_federation_id()
        )
      );
  END IF;

  -- INSERT: System service_role or Team Lead only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks' AND policyname = 'emergency_tasks_insert_policy'
  ) THEN
    CREATE POLICY "emergency_tasks_insert_policy"
      ON public.emergency_incident_tasks FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE team_lead_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        )
      );
  END IF;

  -- UPDATE: Assigned worker can update status (start/complete), Team Lead can assign/reassign
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks' AND policyname = 'emergency_tasks_update_policy'
  ) THEN
    CREATE POLICY "emergency_tasks_update_policy"
      ON public.emergency_incident_tasks FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        assigned_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE team_lead_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        )
      );
  END IF;
END $$;

-- 6. RLS Policies: emergency_additional_worker_requests
DO $$
BEGIN
  -- SELECT: Team members, Federation Admin, Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_additional_worker_requests' AND policyname = 'emergency_add_workers_select_policy'
  ) THEN
    CREATE POLICY "emergency_add_workers_select_policy"
      ON public.emergency_additional_worker_requests FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        team_id IN (
          SELECT team_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        ) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE federation_id = public.current_federation_id()
        )
      );
  END IF;

  -- INSERT: Team Lead only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_additional_worker_requests' AND policyname = 'emergency_add_workers_insert_policy'
  ) THEN
    CREATE POLICY "emergency_add_workers_insert_policy"
      ON public.emergency_additional_worker_requests FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (
          requested_by_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) AND
          team_id IN (
            SELECT id FROM public.emergency_response_teams
            WHERE team_lead_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
          )
        )
      );
  END IF;
END $$;

-- 7. Realtime Publications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_incident_tasks;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_additional_worker_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_additional_worker_requests;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260919050000_emergency_tasks.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260919060000_emergency_control_center.sql
-- --------------------------------------------------------------------

-- ============================================================================
-- Migration: 20260919060000_emergency_control_center.sql
-- Description: Federation Emergency Control Center Tables, Audit Logs, Support Requests & RLS
-- ============================================================================

-- 1. Emergency Audit Logs Table
CREATE TABLE IF NOT EXISTS public.emergency_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    previous_state JSONB DEFAULT '{}'::jsonb,
    new_state JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance & chronological queries
CREATE INDEX IF NOT EXISTS idx_emergency_audit_logs_incident_id 
    ON public.emergency_audit_logs (incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_audit_logs_federation_id 
    ON public.emergency_audit_logs (federation_id);

CREATE INDEX IF NOT EXISTS idx_emergency_audit_logs_created_at 
    ON public.emergency_audit_logs (created_at DESC);

-- 2. Emergency Support Requests Table (Additional Team / External Federation Support Foundation)
CREATE TABLE IF NOT EXISTS public.emergency_support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    requesting_federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
    requested_by_admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('ADDITIONAL_TEAM', 'EXTERNAL_FEDERATION_SUPPORT', 'SPECIALIZED_UNIT')),
    target_federation_id UUID REFERENCES public.federations(id) ON DELETE SET NULL,
    requested_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    requested_worker_count INTEGER NOT NULL DEFAULT 1 CHECK (requested_worker_count >= 1),
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING_REVIEW', 'ACCEPTED', 'DECLINED', 'CANCELLED')) DEFAULT 'PENDING_REVIEW',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for support requests
CREATE INDEX IF NOT EXISTS idx_emergency_support_requests_incident_id 
    ON public.emergency_support_requests (incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_support_requests_fed_id 
    ON public.emergency_support_requests (requesting_federation_id);

CREATE INDEX IF NOT EXISTS idx_emergency_support_requests_status 
    ON public.emergency_support_requests (status);

-- 3. Row Level Security (RLS)
ALTER TABLE public.emergency_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_support_requests ENABLE ROW LEVEL SECURITY;

-- Audit logs policies:
-- Service role full access
CREATE POLICY "Service role full access to emergency_audit_logs"
    ON public.emergency_audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users (Federation Admins & Team Members) can read logs within their federation
CREATE POLICY "Federation scoped read for emergency_audit_logs"
    ON public.emergency_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR federation_id = public.current_federation_id()
        OR federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Authenticated Federation Admins can insert audit logs for their federation
CREATE POLICY "Federation Admin can insert emergency_audit_logs"
    ON public.emergency_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR federation_id = public.current_federation_id()
        OR federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Support requests policies:
-- Service role full access
CREATE POLICY "Service role full access to emergency_support_requests"
    ON public.emergency_support_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Federation Admins can read support requests they requested or were targeted to
CREATE POLICY "Federation scoped read for emergency_support_requests"
    ON public.emergency_support_requests
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR requesting_federation_id = public.current_federation_id()
        OR requesting_federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
        OR target_federation_id = public.current_federation_id()
        OR target_federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Federation Admins can insert support requests for their federation
CREATE POLICY "Federation Admin can insert emergency_support_requests"
    ON public.emergency_support_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR requesting_federation_id = public.current_federation_id()
        OR requesting_federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Grants
GRANT ALL ON TABLE public.emergency_audit_logs TO service_role;
GRANT SELECT, INSERT ON TABLE public.emergency_audit_logs TO authenticated;

GRANT ALL ON TABLE public.emergency_support_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.emergency_support_requests TO authenticated;

-- 4. Enable Realtime Publications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'emergency_audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_audit_logs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'emergency_support_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_support_requests;
    END IF;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260919060000_emergency_control_center.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260919070000_emergency_scaling_and_failure.sql
-- --------------------------------------------------------------------

-- ============================================================================
-- Migration: 20260919070000_emergency_scaling_and_failure.sql
-- Description: Multi-Team Emergency Scaling, Failure Handling & Expanded Member States
-- ============================================================================

-- 1. Support Multiple Response Teams per Incident
DO $$
BEGIN
  -- Drop single team unique constraint on emergency_response_teams
  ALTER TABLE public.emergency_response_teams 
    DROP CONSTRAINT IF EXISTS uk_emergency_response_teams_incident;

  -- Add team_type to distinguish PRIMARY, SECONDARY, SPECIALIZED_UNIT, or SUPPORT teams
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emergency_response_teams' 
    AND column_name = 'team_type'
  ) THEN
    ALTER TABLE public.emergency_response_teams
      ADD COLUMN team_type VARCHAR(50) NOT NULL DEFAULT 'PRIMARY';
  END IF;

  -- Add parent_team_id for sub-teams or support teams attached to a primary team
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emergency_response_teams' 
    AND column_name = 'parent_team_id'
  ) THEN
    ALTER TABLE public.emergency_response_teams
      ADD COLUMN parent_team_id UUID REFERENCES public.emergency_response_teams(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice updating emergency_response_teams schema: %', SQLERRM;
END $$;

-- 2. Expand emergency_response_team_members status constraint
DO $$
BEGIN
  ALTER TABLE public.emergency_response_team_members
    DROP CONSTRAINT IF EXISTS emergency_response_team_members_status_check;

  ALTER TABLE public.emergency_response_team_members
    ADD CONSTRAINT emergency_response_team_members_status_check
    CHECK (status IN (
      'ASSIGNED',
      'CHECK-IN_PENDING',
      'ACTIVE',
      'STANDBY',
      'NO_SHOW',
      'REPLACEMENT_REQUIRED',
      'RELEASED'
    ));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice updating emergency_response_team_members_status_check: %', SQLERRM;
END $$;

-- 3. Indexes for Multi-Team Performance
CREATE INDEX IF NOT EXISTS idx_emergency_teams_incident_type 
  ON public.emergency_response_teams(incident_id, team_type);

CREATE INDEX IF NOT EXISTS idx_emergency_teams_parent_team_id 
  ON public.emergency_response_teams(parent_team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_status 
  ON public.emergency_response_team_members(status);

-- 4. Enable Realtime Publications for new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_response_teams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_response_teams;
  END IF;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260919070000_emergency_scaling_and_failure.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260920000000_emergency_time_rules_config.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- MIGRATION: 20260920000000_emergency_time_rules_config.sql
-- PURPOSE: Configurable, data-driven time rules for Emergency Dispatch
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.emergency_time_rules_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID REFERENCES public.federations(id) ON DELETE CASCADE,
  normal_start_time VARCHAR(5) NOT NULL DEFAULT '08:00',
  normal_end_time VARCHAR(5) NOT NULL DEFAULT '18:00',
  peak_start_time VARCHAR(5) NOT NULL DEFAULT '18:00',
  peak_end_time VARCHAR(5) NOT NULL DEFAULT '22:00',
  night_start_time VARCHAR(5) NOT NULL DEFAULT '22:00',
  night_end_time VARCHAR(5) NOT NULL DEFAULT '08:00',
  normal_radius_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  peak_radius_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.50,
  night_radius_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.25,
  max_emergency_radius_km NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  on_call_required_for_night BOOLEAN NOT NULL DEFAULT TRUE,
  offer_expiration_minutes INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_emergency_time_rules_fed UNIQUE (federation_id)
);

CREATE INDEX IF NOT EXISTS idx_time_rules_fed_id ON public.emergency_time_rules_config(federation_id);

-- Insert default global configuration row (federation_id = NULL)
INSERT INTO public.emergency_time_rules_config (
  federation_id,
  normal_start_time,
  normal_end_time,
  peak_start_time,
  peak_end_time,
  night_start_time,
  night_end_time,
  normal_radius_multiplier,
  peak_radius_multiplier,
  night_radius_multiplier,
  max_emergency_radius_km,
  on_call_required_for_night,
  offer_expiration_minutes,
  is_active
) VALUES (
  NULL,
  '08:00',
  '18:00',
  '18:00',
  '22:00',
  '22:00',
  '08:00',
  1.00,
  1.50,
  1.25,
  50.00,
  TRUE,
  5,
  TRUE
) ON CONFLICT DO NOTHING;


-- --------------------------------------------------------------------
-- END OF 20260920000000_emergency_time_rules_config.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260920010000_emergency_live_handoff_realtime_rls.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- COOPERATIVE GIG SERVICES PLATFORM - EMERGENCY SYSTEM
-- Migration: 20260920010000_emergency_live_handoff_realtime_rls.sql
-- Description: Enhances public.current_federation_id() for Federation Admins,
--              updates emergency_incidents SELECT RLS policy to support JWT metadata,
--              and ensures emergency_incidents is registered in supabase_realtime.
-- ====================================================================

-- 1. Enhance current_federation_id() to support Federation Admins via JWT metadata and auth.users
CREATE OR REPLACE FUNCTION public.current_federation_id()
RETURNS UUID AS $$
  SELECT fid FROM (
    -- Priority 1: Worker's federation
    SELECT federation_id AS fid, 1 AS priority 
    FROM public.workers 
    WHERE profile_id = auth.uid() AND federation_id IS NOT NULL

    UNION ALL

    -- Priority 2: JWT user_metadata federation_id
    SELECT (auth.jwt() -> 'user_metadata' ->> 'federation_id')::UUID AS fid, 2 AS priority
    WHERE (auth.jwt() -> 'user_metadata' ->> 'federation_id') IS NOT NULL 
      AND (auth.jwt() -> 'user_metadata' ->> 'federation_id') != ''

    UNION ALL

    -- Priority 3: auth.users raw_user_meta_data federation_id
    SELECT (raw_user_meta_data ->> 'federation_id')::UUID AS fid, 3 AS priority 
    FROM auth.users 
    WHERE id = auth.uid() 
      AND (raw_user_meta_data ->> 'federation_id') IS NOT NULL
      AND (raw_user_meta_data ->> 'federation_id') != ''

    UNION ALL

    -- Priority 4: Federation contact_email matches profile email
    SELECT f.id AS fid, 4 AS priority 
    FROM public.federations f
    JOIN public.profiles p ON f.contact_email = p.email
    WHERE p.id = auth.uid() AND f.id IS NOT NULL

    UNION ALL

    -- Priority 5: Fallback default federation for unassigned FEDERATION_ADMIN
    SELECT f.id AS fid, 5 AS priority 
    FROM public.federations f
    WHERE EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'FEDERATION_ADMIN'
    )
    AND (f.code = 'FED-GJ-AHM-01' OR f.code = 'FED-AMD-01')
    LIMIT 1
  ) sub
  WHERE fid IS NOT NULL
  ORDER BY priority ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Update emergency_incidents SELECT policy to ensure Federation Admin can read and receive Realtime events
DROP POLICY IF EXISTS "emergency_incidents_select_policy" ON public.emergency_incidents;

CREATE POLICY "emergency_incidents_select_policy"
  ON public.emergency_incidents FOR SELECT
  USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    customer_id = auth.uid() OR
    (federation_id IS NOT NULL AND (
      federation_id = public.current_federation_id() OR
      federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    ))
  );

-- 3. Ensure emergency_incidents is registered in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'emergency_incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_incidents;
  END IF;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260920010000_emergency_live_handoff_realtime_rls.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260920020000_emergency_verification_and_resolution.sql
-- --------------------------------------------------------------------

-- ============================================================================
-- Migration: 20260920020000_emergency_verification_and_resolution.sql
-- Description: Task 8 Emergency Verification, Field Check-In, Team Field States & Resolution Workflow
-- ============================================================================

-- 1. Create emergency_verifications table (One Emergency -> One Verification -> Multiple Workers)
CREATE TABLE IF NOT EXISTS public.emergency_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  verification_token VARCHAR(64) NOT NULL UNIQUE,
  verification_code VARCHAR(8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'REVOKED')),
  verified_at TIMESTAMPTZ,
  verified_by_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.emergency_response_teams(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_emergency_verification_incident UNIQUE (incident_id)
);

CREATE INDEX IF NOT EXISTS idx_emergency_verifications_incident 
  ON public.emergency_verifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_emergency_verifications_token 
  ON public.emergency_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_emergency_verifications_code 
  ON public.emergency_verifications(verification_code);

-- 2. Create emergency_check_ins table
CREATE TABLE IF NOT EXISTS public.emergency_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CHECKED_IN' CHECK (status IN ('CHECKED_IN', 'LATE', 'EXCUSED')),
  verification_method VARCHAR(50) NOT NULL DEFAULT 'QR_EMERGENCY_VERIFICATION',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_emergency_check_ins_team_worker UNIQUE (team_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_emergency_check_ins_incident 
  ON public.emergency_check_ins(incident_id);
CREATE INDEX IF NOT EXISTS idx_emergency_check_ins_team 
  ON public.emergency_check_ins(team_id);
CREATE INDEX IF NOT EXISTS idx_emergency_check_ins_worker 
  ON public.emergency_check_ins(worker_id);

-- 3. Add columns to emergency_incidents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verified_by_worker_id'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verified_by_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verification_code'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verification_code VARCHAR(8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verification_token'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verification_token VARCHAR(64);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_requested_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_requested_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_requested_by_worker_id'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_requested_by_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_summary'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_summary TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'completed_work'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN completed_work TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'remaining_concerns'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN remaining_concerns TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_evidence_photos'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_evidence_photos TEXT[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN closed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'closed_by_admin_id'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN closed_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'closure_notes'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN closure_notes TEXT;
  END IF;
END $$;

-- 4. Add field_status to emergency_response_teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_response_teams' AND column_name = 'field_status'
  ) THEN
    ALTER TABLE public.emergency_response_teams 
      ADD COLUMN field_status VARCHAR(50) NOT NULL DEFAULT 'DISPATCHED';
    
    ALTER TABLE public.emergency_response_teams
      ADD CONSTRAINT emergency_response_teams_field_status_check
      CHECK (field_status IN ('DISPATCHED', 'ARRIVING', 'ON_SITE', 'WORK_IN_PROGRESS', 'AWAITING_SUPPORT', 'READY_FOR_RESOLUTION', 'RESOLVED'));
  END IF;
END $$;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.emergency_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_check_ins ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for emergency_verifications
DO $$
BEGIN
  -- SELECT Policy:
  -- Service role, Super Admin, Customer who owns the incident, Team Members assigned to incident, or Federation Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_verifications' AND policyname = 'emergency_verifications_select_policy'
  ) THEN
    CREATE POLICY "emergency_verifications_select_policy"
      ON public.emergency_verifications FOR SELECT
      USING (
        auth.role() = 'service_role' OR
        public.is_super_admin() OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        incident_id IN (
          SELECT incident_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        ) OR
        incident_id IN (
          SELECT id FROM public.emergency_incidents 
          WHERE (federation_id IS NOT NULL AND (
            federation_id = public.current_federation_id() OR
            federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
          ))
        )
      );
  END IF;

  -- ALL for Service Role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_verifications' AND policyname = 'service_role_emergency_verifications'
  ) THEN
    CREATE POLICY "service_role_emergency_verifications"
      ON public.emergency_verifications FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 7. RLS Policies for emergency_check_ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_check_ins' AND policyname = 'emergency_check_ins_select_policy'
  ) THEN
    CREATE POLICY "emergency_check_ins_select_policy"
      ON public.emergency_check_ins FOR SELECT
      USING (
        auth.role() = 'service_role' OR
        public.is_super_admin() OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        incident_id IN (
          SELECT id FROM public.emergency_incidents 
          WHERE (federation_id IS NOT NULL AND (
            federation_id = public.current_federation_id() OR
            federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
          ))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_check_ins' AND policyname = 'service_role_emergency_check_ins'
  ) THEN
    CREATE POLICY "service_role_emergency_check_ins"
      ON public.emergency_check_ins FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 8. Enable Realtime Publications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_verifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_verifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_check_ins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_check_ins;
  END IF;
END $$;


-- --------------------------------------------------------------------
-- END OF 20260920020000_emergency_verification_and_resolution.sql
-- --------------------------------------------------------------------


-- --------------------------------------------------------------------
-- START OF 20260922000000_emergency_incident_cancellation.sql
-- --------------------------------------------------------------------

-- ====================================================================
-- EMERGENCY SERVICES: INCIDENT CANCELLATION STATUS CONSTRAINT UPDATE
-- Migration: 20260922000000_emergency_incident_cancellation.sql
-- Description: Idempotently update emergency_incidents_status_check constraint
--              to include CANCELLED status while preserving all existing statuses.
-- ====================================================================

DO $$ 
DECLARE
  con_record RECORD;
BEGIN
  -- 1. Find and drop any existing check constraints on public.emergency_incidents checking status
  FOR con_record IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'emergency_incidents'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.emergency_incidents DROP CONSTRAINT IF EXISTS ' || quote_ident(con_record.conname);
  END LOOP;

  -- 2. Explicitly drop emergency_incidents_status_check if it still exists
  ALTER TABLE public.emergency_incidents 
    DROP CONSTRAINT IF EXISTS emergency_incidents_status_check;

  -- 3. Add authoritative emergency_incidents_status_check constraint with CANCELLED
  ALTER TABLE public.emergency_incidents 
    ADD CONSTRAINT emergency_incidents_status_check 
    CHECK (status IN (
      'AWAITING_RESPONSE',
      'DISPATCHING',
      'TEAM_FORMING',
      'ACTIVE',
      'STAFFING_SHORTAGE',
      'RESOLVED',
      'CLOSED',
      'CANCELLED'
    ));
END $$;


-- --------------------------------------------------------------------
-- END OF 20260922000000_emergency_incident_cancellation.sql
-- --------------------------------------------------------------------

