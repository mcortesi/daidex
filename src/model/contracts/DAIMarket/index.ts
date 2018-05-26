import { BN } from 'bn.js';
import EthContract from 'ethjs-contract';
import Eth from 'ethjs-query';
import { Address } from '../../base';
import ABI from './MatchingMarket.abi';

const MatchingMarketAddress = process.env.MATCHINGMARKET_ADDRESS!;

export class MatchingMarket {
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
