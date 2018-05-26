import { BN } from "bn.js";
import { Address } from "../base";
import * as metamask from "./metamask";
import { Observable } from "rxjs";
import { TransactionInfo } from "../orderbook";
import { Token } from "../widget";

export interface Wallet {
  name: string;
  account: Observable<Address>;
  etherBalance: Observable<BN>;
  tradeableBalance: (token: Token) => Observable<BN>;

  getAccount(): Promise<Address>;

  dexdexBuy(token: Token, gasPrice: BN, tx: TransactionInfo): Promise<string>;
  dexdexSell(token: Token, gasPrice: BN, tx: TransactionInfo): Promise<string>;
  waitForTransaction(txId: string): Promise<any>;
}

export async function getWallets(): Promise<Wallet[]> {
  const wallets: Wallet[] = [];

  const mMetaMask = await metamask.tryGet();
  if (mMetaMask) {
    wallets.push(mMetaMask);
  }

  return wallets;
}
