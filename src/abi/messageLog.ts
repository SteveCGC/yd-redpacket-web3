export const messageLogAbi = [
  {
    inputs: [{ internalType: 'string', name: 'text', type: 'string' }],
    name: 'store',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
      { indexed: false, internalType: 'string', name: 'message', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }
    ],
    name: 'MessageLogged',
    type: 'event'
  }
] as const;
