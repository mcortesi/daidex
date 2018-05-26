import { Epic } from '../store';
import { WidgetState } from '..';
import { Actions } from '../actions';
import { ServerApi } from '../../server-api';
import { merge } from 'rxjs';
import { orderbook } from './orderbook';
import { walletDetails } from './wallet-details';
import { runTransaction } from './transaction';
import { daiAmount } from './daiAmount';

export type WidgetEpic = Epic<WidgetState, Actions>;

const rootEpic = (api: ServerApi): WidgetEpic => changes =>
  merge(
    orderbook(api)(changes),
    walletDetails(changes),
    daiAmount(changes),
    runTransaction(changes)
  );

export default rootEpic;
