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
