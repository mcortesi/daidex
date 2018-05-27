import { Address } from '../../base';
import { BN } from 'bn.js';
import EthContract, { TxOptions } from 'ethjs-contract';
import Eth from 'ethjs-query';

import ABI from './daidex.abi';

const DaiDexAddress = process.env.DAIDEX_ADDRESS!;

export class DaiDex {
  contract: any;

  constructor(eth: Eth, contractAddress: Address) {
    const contractFactory = EthContract(eth)(ABI);
    this.contract = contractFactory.at(contractAddress);
  }

  async buy(
    tokenToBuy: Address,
    volumeTokenToBuy: BN,
    volumeDai: BN,
    volumeEth: BN,
    ordersData: string,
    txOptions: TxOptions
  ): Promise<string> {
    console.log(
      'daidex:buy',
      tokenToBuy,
      volumeTokenToBuy.toString(10),
      volumeDai.toString(10),
      volumeEth.toString(10),
      ordersData,
      txOptions
    );
    return await this.contract.buy(
      tokenToBuy,
      volumeTokenToBuy.toString(10),
      volumeDai.toString(10),
      volumeEth.toString(10),
      ordersData,
      txOptions
    );
  }

  async sell(
    tokenToSell: Address,
    volumeTokenToSell: BN,
    volumeDai: BN,
    volumeEth: BN,
    ordersData: string,
    txOptions: TxOptions
  ): Promise<string> {
    console.log(
      'daidex:sell',
      tokenToSell,
      volumeTokenToSell,
      volumeDai,
      volumeEth,
      ordersData,
      txOptions
    );

    return await this.contract.sell(
      tokenToSell,
      volumeTokenToSell,
      volumeDai,
      volumeEth,
      ordersData,
      txOptions
    );
  }
}

export default function create(eth: Eth): DaiDex {
  return new DaiDex(eth, DaiDexAddress);
}
