export default [
  {
    inputs: [
      {
        name: 'daiMatchingMarketAddress',
        type: 'address',
      },
      {
        name: 'dexdexAddress',
        type: 'address',
      },
      {
        name: 'daiAddress',
        type: 'address',
      },
      {
        name: 'wethAddress',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    payable: true,
    stateMutability: 'payable',
    type: 'fallback',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'tokenToBuy',
        type: 'address',
      },
      {
        name: 'volumeTokenToBuy',
        type: 'uint256',
      },
      {
        name: 'volumeDai',
        type: 'uint256',
      },
      {
        name: 'volumeEth',
        type: 'uint256',
      },
      {
        name: 'ordersData',
        type: 'bytes',
      },
    ],
    name: 'buy',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'tokenToSell',
        type: 'address',
      },
      {
        name: 'volumeTokenToSell',
        type: 'uint256',
      },
      {
        name: 'volumeDai',
        type: 'uint256',
      },
      {
        name: 'volumeEth',
        type: 'uint256',
      },
      {
        name: 'ordersData',
        type: 'bytes',
      },
    ],
    name: 'sell',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
