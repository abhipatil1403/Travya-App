-- Set default wallet_address for all existing tourists
-- Run in Supabase SQL Editor

UPDATE tourists
SET wallet_address = '0xfc3c82dc4da66469931c7e6b3baf45714ae10864'
WHERE wallet_address IS NULL OR wallet_address = '';
