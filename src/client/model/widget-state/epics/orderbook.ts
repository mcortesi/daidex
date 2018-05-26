import { map, switchMap } from "rxjs/operators";
import { WidgetEpic } from ".";
import { select, promiseFactory } from "../../../utils/rx";
import { ServerApi, OrderEventKind, OrderBookEvent } from "../../server-api";
import { orderbookEvent } from "../actions";
import { never } from "rxjs";

export const orderbook = (api: ServerApi): WidgetEpic => changes =>
  changes.pipe(
    select("state", "tradeable"),
    // switchMap(tradeable => api.orderBookWatcher(tradeable.address)),
    switchMap(tradeable =>
      promiseFactory(async () => {
        const ob = await api.getOrderBook(tradeable.address);
        return {
          kind: OrderEventKind.Snapshot,
          tradeableAddress: tradeable.address,
          snapshot: ob
        } as OrderBookEvent;
      })
    ),
    map(orderbookEvent)
  );
