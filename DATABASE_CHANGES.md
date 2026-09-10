# Database changes – tourist blockchain ID only

Blockchain is used **only for tourists**. No database changes are required for locals or police.

---

## What you need to do in Supabase

1. Open your Supabase project → **SQL Editor**.
2. Run the following script (or the contents of `supabase-migration-tourists-wallet-tx.sql`):

```sql
-- Add columns to `tourists` table only
ALTER TABLE tourists
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS blockchain_tx_hash text;

COMMENT ON COLUMN tourists.wallet_address IS 'Optional Ethereum address (0x...) for on-chain tourist verification.';
COMMENT ON COLUMN tourists.blockchain_tx_hash IS 'Blockchain verification tx hash; set by frontend after police verifies tourist on-chain.';
```

3. Save/run the query. For existing tourists, run `supabase-migration-set-default-wallet.sql`. That’s all.

---

## Column summary

| Table    | Column             | Type | Purpose |
|----------|--------------------|------|---------|
| **tourists** | `wallet_address`    | text | Auto-set for every new tourist (default blockchain ID). Required for on-chain verification. |
| **tourists** | `blockchain_tx_hash` | text | Set by frontend after police successfully verifies tourist on-chain. |

- **locals**: no new columns. No blockchain for locals.
- **Police**: no new columns. No blockchain for police.

---

## Flow

- When a **tourist** is verified by police (frontend):
  - Police connects MetaMask and calls contract `verifyTourist(touristWalletAddress)`.
  - On success, frontend updates Supabase: `verified = true`, `blockchain_tx_hash = txHash`.
- Locals: database-only; no blockchain.
