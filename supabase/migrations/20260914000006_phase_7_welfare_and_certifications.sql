-- ====================================================================
-- KAUSHALYASETU — PHASE 7: WORKER WELFARE, DEVELOPMENT & FEDERATION INTEGRATION
-- ====================================================================

-- 1. Ensure welfare and certification indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_worker_certs_worker_id ON worker_certifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_certs_expiry_date ON worker_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_worker_skills_worker_id ON worker_skills(worker_id);

-- 2. Helpful view for active worker development stats
CREATE OR REPLACE VIEW worker_welfare_summary_view AS
SELECT
  w.id AS worker_id,
  w.profile_id,
  w.federation_id,
  p.full_name AS worker_name,
  w.profession,
  w.experience_years,
  w.joining_date,
  COUNT(wc.id) FILTER (WHERE wc.expiry_date >= CURRENT_DATE) AS active_certifications_count,
  COUNT(wc.id) FILTER (WHERE wc.expiry_date >= CURRENT_DATE AND wc.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')) AS expiring_certifications_count,
  COUNT(wc.id) FILTER (WHERE wc.expiry_date < CURRENT_DATE) AS expired_certifications_count,
  COUNT(ws.id) AS verified_skills_count
FROM workers w
JOIN profiles p ON p.id = w.profile_id
LEFT JOIN worker_certifications wc ON wc.worker_id = w.id
LEFT JOIN worker_skills ws ON ws.worker_id = w.id
GROUP BY w.id, w.profile_id, w.federation_id, p.full_name, w.profession, w.experience_years, w.joining_date;

-- Comments explaining Phase 7 statutory integration
COMMENT ON VIEW worker_welfare_summary_view IS 'Aggregate workforce development and welfare metrics scoped by federation for KaushalyaSetu Phase 7.';
