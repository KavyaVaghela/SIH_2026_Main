-- KaushalyaSetu: Complaints Storage Bucket & Access Control Policies
-- Ensures a private storage bucket for complaint evidence attachments with size & MIME limits.

-- 1. Create or update private complaints bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaints',
  'complaints',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png'];

-- 2. Storage RLS Policies for Complaints Evidence Objects
DO $$
BEGIN
  -- Storage SELECT: Only authorized complaint participants, federation admins, and super admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'complaints_evidence_select_policy'
  ) THEN
    CREATE POLICY "complaints_evidence_select_policy"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'complaints' AND (
          public.is_super_admin() OR
          auth.role() = 'service_role' OR
          EXISTS (
            SELECT 1 FROM public.complaints c
            WHERE (
              c.id::text = (storage.foldername(name))[2] OR
              c.id::text = (storage.foldername(name))[1]
            ) AND (
              c.raised_by = auth.uid() OR
              c.target_profile_id = auth.uid() OR
              c.booking_id IN (
                SELECT b.id FROM public.bookings b WHERE b.federation_id = public.current_federation_id()
              )
            )
          )
        )
      );
  END IF;

  -- Storage INSERT: Authenticated users can insert evidence into complaints bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'complaints_evidence_insert_policy'
  ) THEN
    CREATE POLICY "complaints_evidence_insert_policy"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'complaints' AND (
          auth.role() = 'authenticated' OR
          auth.role() = 'service_role'
        )
      );
  END IF;

  -- Storage DELETE: Service role or super admin cleanup
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'complaints_evidence_delete_policy'
  ) THEN
    CREATE POLICY "complaints_evidence_delete_policy"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'complaints' AND (
          public.is_super_admin() OR
          auth.role() = 'service_role'
        )
      );
  END IF;
END $$;
