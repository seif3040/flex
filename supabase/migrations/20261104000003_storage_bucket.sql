-- ==============================================================================
-- Migration: 20261104000003_storage_bucket.sql
-- Description: Private 'user-uploads' Storage Bucket and Policies
-- Phase: 02 - Supabase Setup & Database Schema
-- Task: P02-T02
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create Private Storage Bucket
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  20971520, -- 20 MB limit per file (docs/SECURITY.md)
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ];

-- ------------------------------------------------------------------------------
-- 2. Storage Policies on storage.objects
-- Path convention: user-uploads/{user_id}/{conversation_id}/{filename}
-- Authenticated users can only read/write objects under their own user_id folder
-- ------------------------------------------------------------------------------
CREATE POLICY "user_uploads_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "user_uploads_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "user_uploads_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "user_uploads_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
