declare module 'ethjs-query' {
  import { BN } from 'bn.js';

  type Address = string;

  export interface TransactionReceipt {
    contractAddress: string;
    gasUsed: BN;
  }

  class Eth {
    constructor(provider: any);

    accounts(): Promise<Address[]>;
    getBalance(account: Address): Promise<BN>;

    getTransactionReceipt(txHash: string): Promise<TransactionReceipt>;
    blockNumber(): Promise<BN>;
    sign(account: Address, str: string): Promise<string>;
  }

  export default Eth;
}
