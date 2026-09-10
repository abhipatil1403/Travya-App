-- DATABASE CHANGES: Tourist blockchain ID only (no locals/police blockchain).
-- Run this in Supabase → SQL Editor.

-- 1. Add columns to `tourists` only
ALTER TABLE tourists
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS blockchain_tx_hash text;

COMMENT ON COLUMN tourists.wallet_address IS 'Optional Ethereum address (0x...) for on-chain tourist verification.';
COMMENT ON COLUMN tourists.blockchain_tx_hash IS 'Blockchain verification tx hash; set by backend when police verifies tourist on-chain.';

-- No changes needed for `locals` or police tables.
