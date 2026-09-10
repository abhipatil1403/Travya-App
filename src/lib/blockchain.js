/**
 * Frontend-only Ethereum (Sepolia) – MetaMask signs all transactions.
 * No backend, no private keys. Static hosting compatible.
 */

import { BrowserProvider, Contract } from 'ethers';
import { TRAVYA_VERIFICATION_ABI } from './contractAbi.js';

export const CONTRACT_ADDRESS = import.meta.env?.VITE_TRAVYA_CONTRACT_ADDRESS || '';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111

export function getEthProvider() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  return window.ethereum;
}

/** Connect MetaMask, ensure Sepolia, return connected address. */
export async function connectWallet() {
  const provider = getEthProvider();
  if (!provider) throw new Error('MetaMask not detected. Install MetaMask and try again.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts?.length) throw new Error('No account selected');
  const chainId = await provider.request({ method: 'eth_chainId' });
  if (chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (e) {
      throw new Error('Please switch to Sepolia Testnet in MetaMask');
    }
  }
  return accounts[0];
}

async function getSigner() {
  const provider = getEthProvider();
  if (!provider) throw new Error('MetaMask not detected');
  const ethersProvider = new BrowserProvider(provider);
  return ethersProvider.getSigner();
}

function getContract(signer) {
  if (!CONTRACT_ADDRESS) throw new Error('Contract not deployed. Set VITE_TRAVYA_CONTRACT_ADDRESS in env.');
  return new Contract(CONTRACT_ADDRESS, TRAVYA_VERIFICATION_ABI, signer);
}

/** Call verifyTourist(touristWallet) – police signs via MetaMask. Returns tx hash. */
export async function verifyTouristOnChain(walletAddress) {
  if (!walletAddress || typeof walletAddress !== 'string') throw new Error('Invalid wallet address');
  const addr = walletAddress.trim();
  if (!addr.startsWith('0x') || addr.length !== 42) throw new Error('Invalid wallet address format');
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.verifyTourist(addr);
  const receipt = await tx.wait();
  if (!receipt?.hash) throw new Error('Transaction failed');
  return receipt.hash;
}

/** Optional: register tourist on-chain (tourist signs via MetaMask). */
export async function registerTouristOnChain(touristId) {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.registerTourist(touristId);
  await tx.wait();
  return tx.hash;
}
