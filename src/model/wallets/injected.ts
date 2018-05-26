import { BN } from 'bn.js';
import Eth, { TransactionReceipt } from 'ethjs-query';
import { Observable, of } from 'rxjs';
import { publishReplay, refCount, switchMap } from 'rxjs/operators';
import { Wallet } from '.';
import { pollDifferences } from '../../utils/rx';
import { Address, Operation } from '../base';
import DAIMarket from '../contracts/DAIMarket';
import DexDex from '../contracts/dexdex';
import Erc20 from '../contracts/erc20';
import { TransactionInfo } from '../orderbook';
import { Token } from '../widget';
import * as WalletErrors from './errors';

// This will resolve on build
const DEXDEX_ADDRESS = process.env.DEXDEX_CONTRACT!;
const NOAFFILIATE = '0x0000000000000000000000000000000000000000';

const WETH_ADDRESS: string = process.env.WETH_ADDRESS!;
const DAI_ADDRESS: string = process.env.DAI_ADDRESS!;

const KnowWallets = [
  {
    name: 'Metamask',
    icon: 'https://metamask.io/img/metamask.png',
    condition: (web3: any) => web3.currentProvider.isMetaMask,
  },
  {
    name: 'Toshi',
    icon:
      'https://lh3.googleusercontent.com/NJxIx1gBbOtXNC5z0f-80q3N3IJRnYXPDKUueYQT53wpRZtXA-mi3rw2SEba-wCQobS3=s360-rw',
    condition: (web3: any) => web3.currentProvider.isToshi,
  },
];

function getWeb3(): { eth: Eth; name: string; icon: string } | null {
  const web3 = (window as any).web3;
  if (typeof web3 !== 'undefined') {
    for (const kw of KnowWallets) {
      if (kw.condition(web3)) {
        return {
          eth: new Eth(web3.currentProvider),
          name: kw.name,
          icon: kw.icon,
        };
      }
    }
  }
  return null;
}

export function getOnLoad<A>(onLoadGetter: () => A): Promise<A> {
  return new Promise(resolve => {
    switch (document.readyState) {
      case 'loading':
        window.addEventListener('load', () => resolve(onLoadGetter()));
        return;
      default:
        resolve(onLoadGetter());
    }
  });
}

function toWalletError(err: any) {
  if (err.value && err.value.message) {
    if (
      err.value.message.indexOf(
        'Error: MetaMask Tx Signature: User denied transaction signature'
      ) >= 0
    ) {
      return WalletErrors.signatureRejected();
    }
    return err;
  }
  return err;
}

class InjectedWallet implements Wallet {
  account = pollDifferences({
    period: 100,
    poller: () => this.getAccount(),
  }).pipe(publishReplay(1), refCount());

  etherBalance = this.account.pipe(
    switchMap(account => {
      if (account) {
        return pollDifferences({
          period: 60 * 1000,
          poller: () => this.eth.getBalance(account),
          compareFn: (a: BN, b: BN) => a.eq(b),
        });
      } else {
        return of(new BN(0));
      }
    })
  );

  constructor(readonly eth: Eth, readonly name: string, readonly icon: string) {}

  async getAccount(): Promise<Address | null> {
    const accounts = await this.eth.accounts();
    return accounts[0] || null;
  }

  daiBalance(): Observable<BN> {
    const tokenContract = Erc20(this.eth, DAI_ADDRESS);

    return this.account.pipe(
      switchMap(account => {
        if (account) {
          return pollDifferences({
            period: 60 * 1000,
            poller: () => tokenContract.balanceOf(account),
            compareFn: (a: BN, b: BN) => a.eq(b),
          });
        } else {
          return of(new BN(0));
        }
      })
    );
  }
  tradeableBalance(token: Token): Observable<BN> {
    const tokenContract = Erc20(this.eth, token.address);

    return this.account.pipe(
      switchMap(account => {
        if (account) {
          return pollDifferences({
            period: 60 * 1000,
            poller: () => tokenContract.balanceOf(account),
            compareFn: (a: BN, b: BN) => a.eq(b),
          });
        } else {
          return of(new BN(0));
        }
      })
    );
  }

  async daiAmount(operation: Operation, volumeEth: BN) {
    const daiMarket = DAIMarket(this.eth);

    if (operation === 'buy') {
      return await daiMarket.getPayAmount(DAI_ADDRESS, WETH_ADDRESS, volumeEth);
    } else {
      return await daiMarket.getBuyAmount(DAI_ADDRESS, WETH_ADDRESS, volumeEth);
    }
  }

  async dexdexBuy(token: Token, gasPrice: BN, tx: TransactionInfo) {
    try {
      const account = await this.getAccount();
      if (account == null) {
        throw new Error('No selecte account');
      }
      const dexdex = DexDex(this.eth, DEXDEX_ADDRESS);
      const ordersData = tx.getOrderParameters();
      return await dexdex.buy(token.address, tx.currentVolume, ordersData, NOAFFILIATE, {
        from: account,
        value: tx.currentVolumeEthUpperBound,
        gasPrice,
      });
    } catch (err) {
      throw toWalletError(err);
    }
  }

  async dexdexSell(token: Token, gasPrice: BN, tx: TransactionInfo): Promise<string> {
    try {
      const account = await this.getAccount();
      if (account == null) {
        throw new Error('No selecte account');
      }
      const dexdex = DexDex(this.eth, DEXDEX_ADDRESS);
      const ordersData = tx.getOrderParameters();
      return await dexdex.sell(
        token.address,
        tx.currentVolume,
        tx.currentVolumeEth,
        ordersData,
        NOAFFILIATE,
        { from: account, gasPrice }
      );
    } catch (err) {
      throw toWalletError(err);
    }
  }

  async waitForTransaction(txId: string): Promise<TransactionReceipt> {
    let txReceipt;
    while (!txReceipt) {
      try {
        txReceipt = await this.eth.getTransactionReceipt(txId);
      } catch (err) {
        console.log('errror', err);
      }
    }

    return txReceipt;
  }

  async approveTokenAllowance(token: Token, volume: BN, gasPrice: BN): Promise<string> {
    const account = await this.getAccount();
    if (account == null) {
      throw new Error('No selected account');
    }
    const tokenContract = Erc20(this.eth, token.address);
    return tokenContract.approve(DEXDEX_ADDRESS, volume, { from: account, gasPrice });
  }

  async approveDAIAllowance(volume: BN, gasPrice: BN): Promise<string> {
    const account = await this.getAccount();
    if (account == null) {
      throw new Error('No selected account');
    }
    const tokenContract = Erc20(this.eth, DAI_ADDRESS);
    return tokenContract.approve(DEXDEX_ADDRESS, volume, { from: account, gasPrice });
  }
}

export async function tryGet(): Promise<Wallet | null> {
  const mEth = await getOnLoad(getWeb3);
  if (mEth) {
    return new InjectedWallet(mEth.eth, mEth.name, mEth.icon);
  }
  return null;
}
