import { map, switchMap, startWith, exhaustMap } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { promiseFactory, select } from '../../../utils/rx';
import { OrderBookEvent, OrderEventKind, ServerApi } from '../../server-api';
import { orderbookEvent, Actions } from '../actions';
import { Observable, interval } from 'rxjs';
import { Change } from '../store';
import { WidgetState } from '..';

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export const orderbook = (api: ServerApi): WidgetEpic => (
  changes: Observable<Change<WidgetState, Actions>>
) =>
  changes.pipe(
    select('state', 'tradeable'),
    // switchMap(tradeable => api.orderBookWatcher(tradeable.address)),
    switchMap(tradeable =>
      interval(POLL_INTERVAL).pipe(
        startWith(-1),
        exhaustMap(() =>
          promiseFactory(async () => {
            const ob = await api.getOrderBook(tradeable.address);
            return {
              kind: OrderEventKind.Snapshot,
              tradeableAddress: tradeable.address,
              snapshot: ob,
            } as OrderBookEvent;
          })
        )
      )
    ),
    map(orderbookEvent)
  );
