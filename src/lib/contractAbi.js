// ABI for TravyaVerification.sol – tourist blockchain ID only (registerTourist, verifyTourist)
export const TRAVYA_VERIFICATION_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'touristId', type: 'string' }],
    name: 'registerTourist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'touristWallet', type: 'address' }],
    name: 'verifyTourist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'tourists',
    outputs: [
      { internalType: 'address', name: 'walletAddress', type: 'address' },
      { internalType: 'string', name: 'touristId', type: 'string' },
      { internalType: 'bool', name: 'isRegistered', type: 'bool' },
      { internalType: 'bool', name: 'isVerified', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
