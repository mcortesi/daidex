import { BN } from 'bn.js';
import { Address, Operation } from '../base';
import * as injected from './injected';
import { Observable } from 'rxjs';
import { TransactionInfo } from '../orderbook';
import { Token } from '../widget';

export interface Wallet {
  name: string;
  icon: string;
  account: Observable<Address>;
  etherBalance: Observable<BN>;
  tradeableBalance: (token: Token) => Observable<BN>;
  daiBalance: () => Observable<BN>;
  daiAmount: (op: Operation, amount: BN) => Promise<BN>;

  getAccount(): Promise<Address>;

  dexdexBuy(token: Token, gasPrice: BN, tx: TransactionInfo): Promise<string>;
  dexdexSell(token: Token, gasPrice: BN, tx: TransactionInfo): Promise<string>;
  waitForTransaction(txId: string): Promise<any>;
}

export async function getWallets(): Promise<Wallet[]> {
  const wallets: Wallet[] = [];

  const mInjected = await injected.tryGet();
  if (mInjected) {
    wallets.push(mInjected);
  }

  return wallets;
}
