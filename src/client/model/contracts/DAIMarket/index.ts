import Eth from 'ethjs-query';
import EthContract, { TxOptions, TxHash } from 'ethjs-contract';
import { BN } from 'bn.js';
import { Address } from '../../base';

import ABI from './MatchingMarket.abi';

const MatchingMarketAddress = '0x14FBCA95be7e99C15Cc2996c6C9d841e54B79425';

class MatchingMarket {
  contract: any;

  constructor(eth: Eth, contractAddress: Address) {
    const contractFactory = EthContract(eth)(ABI);
    this.contract = contractFactory.at(contractAddress);
  }

  async getBuyAmount(buyGem: Address, payGem: Address, payAmount: BN): Promise<BN> {
    return (await this.contract.getBuyAmount(buyGem, payGem, payAmount))[0];
  }

  async getPayAmount(payGem: Address, buyGem: Address, buyAmount: BN): Promise<BN> {
    return (await this.contract.getBuyAmount(payGem, buyGem, buyAmount))[0];
  }
}

export default function create(eth: Eth): MatchingMarket {
  return new MatchingMarket(eth, MatchingMarketAddress);
}
