import Eth from 'ethjs-query';
import EthContract, { TxOptions, TxHash } from 'ethjs-contract';
import { BN } from 'bn.js';
import { Address } from '../../base';

import * as ERC20ABI from './erc20.abi';

export interface ERC20Token {
  totalSupply(): Promise<BN>;
  balanceOf(who: Address): Promise<BN>;
  transfer(to: Address, value: BN, txOptions?: TxOptions): Promise<TxHash>;

  allowance(owner: Address, spender: Address): Promise<BN>;
  transferFrom(from: Address, to: Address, value: BN): Promise<TxHash>;
  approve(spender: Address, value: BN): Promise<TxHash>;
}

class StdERC20Token implements ERC20Token {
  contract: any;

  constructor(eth: Eth, contractAddress: Address) {
    const contractFactory = EthContract(eth)(ERC20ABI);
    this.contract = contractFactory.at(contractAddress);
  }

  async totalSupply(): Promise<BN> {
    return (await this.contract.totalSupply())[0];
  }
  async balanceOf(who: Address): Promise<BN> {
    return (await this.contract.balanceOf(who))[0];
  }

  async transfer(to: Address, value: BN, txOptions?: TxOptions): Promise<TxHash> {
    return this.contract.transfer(to, value, txOptions);
  }
  async allowance(owner: Address, spender: Address): Promise<BN> {
    return (await this.contract.allowance(owner, spender))[0];
  }
  async transferFrom(
    from: Address,
    to: Address,
    value: BN,
    txOptions?: TxOptions
  ): Promise<TxHash> {
    return this.contract.transferFrom(from, to, value, txOptions);
  }
  async approve(spender: Address, value: BN, txOptions?: TxOptions): Promise<TxHash> {
    return this.contract.approve(spender, value, txOptions);
  }
}

export default function create(eth: Eth, address: Address): ERC20Token {
  return new StdERC20Token(eth, address);
}

// type ContractFactory<C> = (eth: Eth, contractAddress: Address) => C;

// function contractWrapper<C, VM extends keyof C>(abi: Abi, viewMethods: VM[]): ContractFactory<C> {
//   return (eth, address) => {
//     const contractFactory = EthContract(eth)(abi);
//     const contract = contractFactory.at(address);

//     getter

//     const wrapper: Record<keyof C, any> = {};

//     for (vm of viewMethods) {
//       wrapper[vm] = async (...args) => {
//         const res = await contract[vm]
//       }
//     }

//     return null as any;
//   }
// }

// export function contractInstance(eth: Eth, contractAddress: Address) {
//   const contractFactory = EthContract(eth)(ERC20ABI);
//   return contractFactory.at(contractAddress);
// }
