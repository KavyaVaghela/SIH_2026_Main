-- ====================================================================
-- Migration: 20260913000000_worker_registration_fields.sql
-- Description: Adds worker member ID, date of birth, gender, registration type,
-- previous work details, government ID fields, bank details, and rejection reason.
-- Also sets up avatars and documents storage buckets with RLS.
-- ====================================================================

-- 1. ADD COLUMNS TO PUBLIC.WORKERS
ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS member_id VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'NEW_WORKER',
  ADD COLUMN IF NOT EXISTS previous_work_details TEXT,
  ADD COLUMN IF NOT EXISTS govt_id_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS govt_id_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS govt_id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(150),
  ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_workers_registration_type ON public.workers(registration_type);
CREATE INDEX IF NOT EXISTS idx_workers_member_id ON public.workers(member_id);

-- 3. INITIALIZE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 4. STORAGE RLS POLICIES
DO $$
BEGIN
  -- avatars bucket: public read, authenticated insert/update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_public_select'
  ) THEN
    CREATE POLICY "avatars_public_select"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_authenticated_insert'
  ) THEN
    CREATE POLICY "avatars_authenticated_insert"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_authenticated_update'
  ) THEN
    CREATE POLICY "avatars_authenticated_update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;

  -- documents bucket: private, worker + admin only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'documents_owner_and_admin_select'
  ) THEN
    CREATE POLICY "documents_owner_and_admin_select"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'documents' AND (
          auth.uid()::text = (storage.foldername(name))[1] OR
          public.is_super_admin() OR
          EXISTS (
            SELECT 1 FROM public.federations f
            JOIN public.workers w ON w.federation_id = f.id
            WHERE w.profile_id::text = (storage.foldername(name))[1]
              AND f.contact_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'documents_owner_insert'
  ) THEN
    CREATE POLICY "documents_owner_insert"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'documents' AND (
          auth.uid()::text = (storage.foldername(name))[1] OR
          public.is_super_admin()
        )
      );
  END IF;
END $$;
