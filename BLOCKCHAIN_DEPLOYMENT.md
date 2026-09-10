# Travya – Frontend-only blockchain (Sepolia)

All blockchain interactions run in the browser via MetaMask. No backend, no private keys. Static hosting (e.g. Netlify) compatible.

## 1. Solidity contract

- **File:** `contracts/TravyaVerification.sol`
- **Network:** Sepolia Testnet

### Deploy from Remix

1. Open [remix.ethereum.org](https://remix.ethereum.org)
2. Paste `contracts/TravyaVerification.sol`, compile (0.8.19)
3. Deploy with MetaMask on Sepolia
4. Call **`registerPolice(policeWalletAddress)`** from Remix so police can call `verifyTourist`
5. Set `VITE_TRAVYA_CONTRACT_ADDRESS=0x...` in `.env`

## 2. Flow

**Tourist registration:** Connect MetaMask (Sepolia) → register form → `wallet_address` stored in Supabase

**Police verify:** Connect MetaMask (police wallet) → call `verifyTourist(touristWalletAddress)` → wait for tx → update Supabase `verified=true`, `blockchain_tx_hash`

## 3. Env vars

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TRAVYA_CONTRACT_ADDRESS=0x...
```

## 4. DB migration

Run `supabase-migration-tourists-wallet-tx.sql` in Supabase SQL Editor to add `wallet_address` and `blockchain_tx_hash` to `tourists`.

## 5. Deployment

- **Build:** `npm run build`
- **Preview:** `npm run preview`
- Deploy `dist/` to Netlify (or any static host). No backend required.
