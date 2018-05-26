import { BN } from "bn.js";
import { Observable, Observer, empty } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { WidgetEpic } from ".";
import { Operation } from "../../base";
import { TransactionInfo } from "../../orderbook";
import { Wallet } from "../../wallets";
import {
  TransactionState,
  TxStage,
  computeGasPrice,
  Token
} from "../../widget";
import { setTransactionState } from "../actions";
import { filterAction } from "./utils";

function executeTransaction(
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Token,
  operation: Operation,
  tx: TransactionInfo
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    let subscribed = true;

    const run = async () => {
      let txId: string;

      observer.next({ stage: TxStage.SignatureTrade });
      try {
        if (operation === "buy") {
          txId = await wallet.dexdexBuy(tradeable, gasPrice, tx);
        } else {
          txId = await wallet.dexdexSell(tradeable, gasPrice, tx);
        }
        if (!subscribed) {
          return;
        }
        observer.next({ stage: TxStage.WaitingForTrade, txId: txId });
      } catch (err) {
        if (
          err.name === "WalletError" &&
          err.codeName === "SignatureRejected"
        ) {
          observer.next({ stage: TxStage.RejectedSignature });
        } else {
          observer.next({ stage: TxStage.Failed });
        }
      }

      // const txReceipt = await wallet.waitForTransaction(txId);
      // console.log('txReceipt', txReceipt);
      // if (!subscribed) {
      //   return;
      // }
      // observer.next({ stage: TxStage.Completed });
    };

    run()
      .catch(err => observer.error(err))
      .then(() => observer.complete());

    return () => {
      subscribed = false;
    };
  });
}

export const runTransaction: WidgetEpic = changes =>
  changes.pipe(
    filterAction("startTransaction"),
    switchMap(({ state }) => {
      if (state.wallet && state.currentTransaction) {
        const gasPriceBN = computeGasPrice(
          state.config.gasprices,
          state.gasPrice
        );
        const tx = state.currentTransaction;
        return executeTransaction(
          state.wallet,
          gasPriceBN,
          state.tradeable,
          state.operation,
          tx
        );
      } else {
        return empty();
      }
    }),
    map(setTransactionState)
  );
