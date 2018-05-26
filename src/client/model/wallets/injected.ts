import { BN } from 'bn.js';
import Eth, { TransactionReceipt } from 'ethjs-query';
import { Observable } from 'rxjs';
import { publishReplay, refCount, switchMap } from 'rxjs/operators';
import { Wallet } from '.';
import { pollDifferences } from '../../utils/rx';
import { Address, Operation } from '../base';
import DexDex from '../contracts/dexdex';
import Erc20 from '../contracts/erc20';
import DAIMarket from '../contracts/DAIMarket';
import { TransactionInfo } from '../orderbook';
import * as WalletErrors from './errors';
import { Token } from '../widget';

// This will resolve on build
const DEXDEX_ADDRESS = process.env.DEXDEX_CONTRACT!;
const NOAFFILIATE = '0x0000000000000000000000000000000000000000';

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const DAI_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';

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
    switchMap(account =>
      pollDifferences({
        period: 60 * 1000,
        poller: () => this.eth.getBalance(account),
        compareFn: (a: BN, b: BN) => a.eq(b),
      })
    )
  );

  constructor(readonly eth: Eth, readonly name: string, readonly icon: string) {}

  async getAccount(): Promise<Address> {
    const accounts = await this.eth.accounts();
    return accounts[0];
  }

  daiBalance(): Observable<BN> {
    const tokenContract = Erc20(this.eth, DAI_ADDRESS);

    return this.account.pipe(
      switchMap(account =>
        pollDifferences({
          period: 60 * 1000,
          poller: () => tokenContract.balanceOf(account),
          compareFn: (a: BN, b: BN) => a.eq(b),
        })
      )
    );
  }
  tradeableBalance(token: Token): Observable<BN> {
    const tokenContract = Erc20(this.eth, token.address);

    return this.account.pipe(
      switchMap(account =>
        pollDifferences({
          period: 60 * 1000,
          poller: () => tokenContract.balanceOf(account),
          compareFn: (a: BN, b: BN) => a.eq(b),
        })
      )
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

  async commitTransaction(tx: TransactionInfo): Promise<void> {
    // const sgn = await eth.sign(account, `0x${mtosign.toString('hex')}`);
    // this.eth.
    /*
    - "instancear" el contrato de dexdex
    - llamar a buy() o sell()
    - buy(tradeableAddress, volume, orders.addresses, orders.uints, orders.bytes, affiliateAddress o (0x0000..))
    - buy() mandar la # de ethers del volumeEth

    - sell(tradeableAddress, volume, volumeEth, orders.addresses, orders.uints, orders.bytes, affiliateAddress o (0x0000..))
    - before Sell need  to authorize....



    */
  }
}

export async function tryGet(): Promise<InjectedWallet | null> {
  const mEth = await getOnLoad(getWeb3);
  if (mEth) {
    return new InjectedWallet(mEth.eth, mEth.name, mEth.icon);
  }
  return null;
}
