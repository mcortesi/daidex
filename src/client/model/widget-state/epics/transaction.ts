import { BN } from 'bn.js';
import { Observable, Observer, empty } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { Operation } from '../../base';
import { TransactionInfo } from '../../orderbook';
import { Wallet } from '../../wallets';
import { TransactionState, TxStage, computeGasPrice, Token } from '../../widget';
import { setTransactionState } from '../actions';
import { filterAction } from './utils';
import { promiseFactory } from '../../../utils/rx';

async function executeTransaction(
  wallet: Wallet,
  gasPrice: BN,
  tradeable: Token,
  operation: Operation,
  tx: TransactionInfo,
  reportState: (newState: TransactionState) => void
) {
  try {
    if (operation === 'buy') {
      reportState({ stage: TxStage.RequestDAIAllowanceSignature });

      const daiVolume = await wallet.daiAmount('buy', tx.currentVolumeEthUpperBound);
      // TODO ask allowance for DAI
      const allowanceTxId = await wallet.approveDAIAllowance(daiVolume, gasPrice);
      reportState({ stage: TxStage.DAIAllowanceInProgress, txId: allowanceTxId });
      const allowancTxReceipt = await wallet.waitForTransaction(allowanceTxId);

      reportState({ stage: TxStage.RequestTradeSignature });
      const tradeTxId = await wallet.dexdexBuy(tradeable, gasPrice, tx);
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      reportState({ stage: TxStage.Completed });
    } else {
      reportState({ stage: TxStage.RequestTokenAllowanceSignature });
      const allowanceTxId = await wallet.approveTokenAllowance(
        tradeable,
        tx.currentVolume,
        gasPrice
      );
      reportState({ stage: TxStage.TokenAllowanceInProgress, txId: allowanceTxId });
      const allowancTxReceipt = await wallet.waitForTransaction(allowanceTxId);

      reportState({ stage: TxStage.RequestTradeSignature });
      const tradeTxId = await wallet.dexdexBuy(tradeable, gasPrice, tx);
      reportState({ stage: TxStage.TradeInProgress, txId: tradeTxId });
      const tradeTxReceipt = await wallet.waitForTransaction(tradeTxId);
      reportState({ stage: TxStage.Completed });
    }
  } catch (err) {
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
  tx: TransactionInfo
): Observable<TransactionState> {
  return Observable.create(async (observer: Observer<TransactionState>) => {
    executeTransaction(wallet, gasPrice, tradeable, operation, tx, state => observer.next(state))
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
      if (state.wallet && state.currentTransaction) {
        const gasPriceBN = computeGasPrice(state.config.gasprices, state.gasPrice);
        const tx = state.currentTransaction;
        return executeTransactionObs(
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
