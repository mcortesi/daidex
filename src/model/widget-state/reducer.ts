import { WidgetScreen, WidgetState } from '.';
import { fixDecimals, removeExtraZeros } from '../../utils/format';
import { Operation } from '../base';
import { OrderBook, OrderBookSide, getSide, updateSide, orderBookActions } from '../orderbook';
import { OrderBookEvent, OrderEventKind } from '../server-api';
import { fromTokenDecimals, toTokenDecimals } from '../units';
import { TransactionState, TxStage } from '../widget';
import { Actions } from './actions';

const TxStageScreenMap: Record<TxStage, WidgetScreen> = {
  [TxStage.Idle]: 'form',
  [TxStage.TokenAllowanceInProgress]: 'waitingApproval',
  [TxStage.DAIAllowanceInProgress]: 'waitingDAIApproval',
  [TxStage.TradeInProgress]: 'waitingTrade',
  [TxStage.RequestTokenAllowanceSignature]: 'signatureApproval',
  [TxStage.RequestDAIAllowanceSignature]: 'signatureDAIApproval',
  [TxStage.RequestTradeSignature]: 'signatureTrade',
  [TxStage.Completed]: 'tradeSuccess',
  [TxStage.Failed]: 'error',
  [TxStage.SignatureRejected]: 'rejectedSignature',
};

function txEventToScreen(txEvent: TransactionState): WidgetScreen {
  return TxStageScreenMap[txEvent.stage];
}

const OB = orderBookActions();

function applyEvent(ob: OrderBook, event: OrderBookEvent): OrderBook {
  switch (event.kind) {
    case OrderEventKind.Add:
      return updateSide(ob, event.order.isSell)(OB.addOrder(event.order));

    case OrderEventKind.Delete:
      return updateSide(ob, event.order.isSell)(OB.removeOrder(event.order));

    case OrderEventKind.Update:
      return updateSide(ob, event.order.isSell)(OB.updateOrder(event.order));

    case OrderEventKind.Snapshot:
      return OB.newOrderBook(event.snapshot);
    default:
      throw new Error(`invalid OrderEvent ${event}`);
  }
}

function applySetters(state: WidgetState, action: Actions): WidgetState {
  switch (action.type) {
    case 'setAmount':
      return { ...state, amount: action.payload, amountPristine: false };
    case 'setGasPrice':
      return { ...state, gasPrice: action.payload };
    case 'setOperation':
      return { ...state, operation: action.payload };
    case 'setWallet':
      return { ...state, wallet: action.payload };
    case 'setWalletDetails':
      return { ...state, walletDetails: action.payload };
    case 'setDAIVolume':
      return { ...state, currentTransactionDai: action.payload };
    case 'setToken':
      return {
        ...state,
        tradeable: action.payload,
      };
    case 'orderbookEvent':
      return {
        ...state,
        orderbook: applyEvent(state.orderbook || OB.newOrderBook(), action.payload),
      };

    case 'setTransactionState':
      return {
        ...state,
        tradeTxHash:
          action.payload.stage === TxStage.TradeInProgress
            ? action.payload.txId
            : state.tradeTxHash,
        approvalTxHash:
          action.payload.stage === TxStage.TokenAllowanceInProgress
            ? action.payload.txId
            : state.approvalTxHash,
        screen: txEventToScreen(action.payload),
      };
    default:
      return { ...state };
  }
}

const computeIsValidAmount = (amount: string, decimals: number, obside: OrderBookSide | null) => {
  if (amount.length === 0) {
    return false;
  }

  if (obside === null) {
    return true;
  }
  return OB.isValidVolume(obside, toTokenDecimals(amount, decimals));
};

const getCurrentSide = (orderbook: OrderBook | null, op: Operation) =>
  orderbook == null ? null : getSide(orderbook, op);

const changeChecker = <A>(oldVal: A, newVal: A) => (...keys: (keyof A)[]): boolean =>
  keys.some(key => oldVal[key] !== newVal[key]);

function reducer(oldState: WidgetState, action: Actions) {
  // apply changes to direct fields in the state
  let st = applySetters(oldState, action);
  const anyChanged = changeChecker(oldState, st);

  // reset orderbook when tradeable changes
  if (anyChanged('tradeable')) {
    st.orderbook = null;
  }

  // If amount is Pristine, we automatically set the amount to the minimun Buy/Sell amount
  if (st.amountPristine && st.orderbook && anyChanged('operation', 'orderbook')) {
    st.amount = removeExtraZeros(
      fromTokenDecimals(getSide(st.orderbook, st.operation).minVolume, st.tradeable.decimals)
    );
  }

  // If tradeable changed, we adjust the amount to the number of decimals of it
  if (anyChanged('tradeable')) {
    st.amount = fixDecimals(st.amount, st.tradeable.decimals);
  }

  const oldSide = getCurrentSide(oldState.orderbook, oldState.operation);
  const currentSide = getCurrentSide(st.orderbook, st.operation);

  // Recompute isValidAmount if (side,amount or tradeable) changed
  if (oldSide !== currentSide || anyChanged('amount', 'tradeable')) {
    st.isValidAmount = computeIsValidAmount(st.amount, st.tradeable.decimals, currentSide);
  }

  // Recompute currentTransaction when necessary
  if (currentSide == null || !st.isValidAmount) {
    // we don't have orderbook or the amount is invalid => no valid tx
    st.currentTransaction = null;
  } else if (oldSide !== currentSide) {
    // ordebookSide changed => (side orders changed OR operation changed) => recompute
    st.currentTransaction = OB.computeTransaction(
      currentSide,
      toTokenDecimals(st.amount, st.tradeable.decimals)
    );
  } else if (anyChanged('amount')) {
    // only the amount changed. Maybe the current computed transaction is still valid
    const volumeTD = toTokenDecimals(st.amount, st.tradeable.decimals);
    if (st.currentTransaction && st.currentTransaction.canHandle(volumeTD)) {
      st.currentTransaction!.changeVolume(volumeTD);
    } else {
      // current is not valid => recompute
      st.currentTransaction = OB.computeTransaction(
        currentSide,
        toTokenDecimals(st.amount, st.tradeable.decimals)
      );
    }
  }

  return st;
}

export const reducerWithDefaults = (initialState: WidgetState) => (
  state: WidgetState | undefined,
  action: Actions
) => (state === undefined ? reducer(initialState, action) : reducer(state, action));
