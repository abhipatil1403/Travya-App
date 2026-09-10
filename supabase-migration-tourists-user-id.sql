-- Migration: Ensure user_id is set when head adds family member
-- Run this in Supabase SQL Editor ONCE

-- 1. Add user_id column to tourists if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tourists' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.tourists ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Create RPC function to insert tourist with user_id (bypasses RLS for that column)
CREATE OR REPLACE FUNCTION public.create_tourist_with_user_id(
  p_user_id UUID,
  p_fullname TEXT,
  p_email TEXT,
  p_phoneno TEXT DEFAULT NULL,
  p_verified BOOLEAN DEFAULT false,
  p_nationality TEXT DEFAULT NULL,
  p_documenttype TEXT DEFAULT NULL,
  p_documentno TEXT DEFAULT NULL,
  p_registrationpoint TEXT DEFAULT NULL,
  p_checkindate DATE DEFAULT NULL,
  p_checkoutdate DATE DEFAULT NULL,
  p_emergencycontacts JSONB DEFAULT '[]',
  p_travelitinerary JSONB DEFAULT '[]',
  p_photo TEXT DEFAULT NULL,
  p_documentphoto TEXT DEFAULT NULL,
  p_wallet_address TEXT DEFAULT '0x0000000000000000000000000000000000000000'
)
RETURNS SETOF tourists
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO tourists (
    user_id, fullname, email, phoneno, verified,
    nationality, documenttype, documentno, registrationpoint,
    checkindate, checkoutdate, emergencycontacts, travelitinerary,
    photo, documentphoto, wallet_address
  ) VALUES (
    p_user_id, p_fullname, p_email, p_phoneno, p_verified,
    p_nationality, p_documenttype, p_documentno, p_registrationpoint,
    p_checkindate::date, p_checkoutdate::date, p_emergencycontacts, p_travelitinerary,
    p_photo, p_documentphoto, p_wallet_address
  )
  RETURNING *;
END;
$$;
