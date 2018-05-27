import { BN } from 'bn.js';
import { Observable, Observer, empty } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { Operation } from '../../base';
import { TransactionInfo } from '../../orderbook';
import { Wallet } from '../../wallets';
import { Token, TransactionState, TxStage, computeGasPrice } from '../../widget';
import { setTransactionState } from '../actions';
import { filterAction } from './utils';

async function executeTransaction(
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Token,
  operation: Operation,
  tx: TransactionInfo,
  daiVolume: BN,
  reportState: (newState: TransactionState) => void
) {
  try {
    if (operation === 'buy') {
      reportState({ stage: TxStage.RequestDAIAllowanceSignature });
      const allowanceTxId = await wallet.approveDAIAllowance(daiVolume, gasPrice);

      reportState({ stage: TxStage.DAIAllowanceInProgress, txId: allowanceTxId });
      await wallet.waitForTransaction(allowanceTxId);

      reportState({ stage: TxStage.RequestTradeSignature });
      const tradeTxId = await wallet.dexdexBuy(tradeable, gasPrice, tx, daiVolume);
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      console.log(tradeTxReceipt);
      reportState({ stage: TxStage.Completed });
    } else {
      reportState({ stage: TxStage.RequestTokenAllowanceSignature });
      const allowanceTxId = await wallet.approveTokenAllowance(
        tradeable,
        tx.currentVolume,
        gasPrice
      );
      reportState({ stage: TxStage.TokenAllowanceInProgress, txId: allowanceTxId });
      await wallet.waitForTransaction(allowanceTxId);

      reportState({ stage: TxStage.RequestTradeSignature });
      const tradeTxId = await wallet.dexdexSell(tradeable, gasPrice, tx, daiVolume);
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      console.log(tradeTxReceipt);
      reportState({ stage: TxStage.Completed });
    }
  } catch (err) {
    console.error(err);
    if (err.name === 'WalletError' && err.codeName === 'SignatureRejected') {
      reportState({ stage: TxStage.SignatureRejected });
    } else {
      reportState({ stage: TxStage.Failed });
    }
  }
}

function executeTransactionObs(
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Token,
  operation: Operation,
  tx: TransactionInfo,
  daiVolume: BN
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    executeTransaction(wallet, gasPrice, tradeable, operation, tx, daiVolume, state =>
      observer.next(state)
    )
      .catch(err => observer.error(err))
      .then(() => observer.complete());

    return () => {
      console.log("can't unsubscribe to this observable");
    };
  });
}

export const runTransaction: WidgetEpic = changes =>
  changes.pipe(
    filterAction('startTransaction'),
    switchMap(({ state }) => {
      if (state.wallet && state.currentTransaction && state.currentTransactionDai) {
        const gasPriceBN = computeGasPrice(state.config.gasprices, state.gasPrice);
        const tx = state.currentTransaction;
        return executeTransactionObs(
          state.wallet,
          gasPriceBN,
          state.tradeable,
          state.operation,
          tx,
          state.currentTransactionDai
        );
      } else {
        return empty();
      }
    }),
    map(setTransactionState)
  );
