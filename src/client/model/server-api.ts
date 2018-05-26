import { Observable, Observer } from "rxjs";
import { filter, withLatestFrom, share, map } from "rxjs/operators";

import { Address } from "./base";
import { JsonOrder, Order, fromJsonOrder } from "./order";
import { WidgetConfig } from "./widget";

//-------------------------------------------------------------------------------------------------
// Types
//-------------------------------------------------------------------------------------------------

export enum OrderEventKind {
  Add = "Add",
  Delete = "Delete",
  Update = "Update",
  Snapshot = "Snapshot"
}

export interface OrderBookSnapshot {
  sells: Order[];
  buys: Order[];
}
export type OrderBookEvent =
  | {
      kind: OrderEventKind.Snapshot;
      tradeableAddress: Address;
      snapshot: OrderBookSnapshot;
    }
  | { kind: OrderEventKind.Add; tradeableAddress: Address; order: Order }
  | { kind: OrderEventKind.Update; tradeableAddress: Address; order: Order }
  | { kind: OrderEventKind.Delete; tradeableAddress: Address; order: Order };

export interface JsonOrderBookSnapshot {
  sells: JsonOrder[];
  buys: JsonOrder[];
}

export type JsonOrderBookEvent =
  | {
      kind: OrderEventKind.Snapshot;
      tradeableAddress: Address;
      snapshot: JsonOrderBookSnapshot;
    }
  | { kind: OrderEventKind.Add; tradeableAddress: Address; order: JsonOrder }
  | { kind: OrderEventKind.Update; tradeableAddress: Address; order: JsonOrder }
  | {
      kind: OrderEventKind.Delete;
      tradeableAddress: Address;
      order: JsonOrder;
    };

export interface ServerApi {
  getWidgetConfig(widgetId: string): Promise<Exclude<WidgetConfig, "wallets">>;
  getOrderBook(tokenAddress: string): Promise<OrderBookSnapshot>;
}

export type ApiOptions = {
  url: string;
};

//-------------------------------------------------------------------------------------------------
// Helpers
//-------------------------------------------------------------------------------------------------

export function fromJsonOrderbookSnapshot(
  jsonSnap: JsonOrderBookSnapshot
): OrderBookSnapshot {
  return {
    buys: jsonSnap.buys.map(fromJsonOrder),
    sells: jsonSnap.sells.map(fromJsonOrder)
  };
}

export function fromJsonOrderbookEvent(
  event: JsonOrderBookEvent
): OrderBookEvent {
  if (event.kind === OrderEventKind.Snapshot) {
    return {
      ...event,
      snapshot: fromJsonOrderbookSnapshot(event.snapshot)
    };
  } else {
    return {
      ...event,
      order: fromJsonOrder(event.order)
    };
  }
}

//-------------------------------------------------------------------------------------------------
// Api Impl
//-------------------------------------------------------------------------------------------------

const getWidgetConfig = (baseUrl: string) => async (
  widgetId: string
): Promise<Exclude<WidgetConfig, "wallets">> => {
  const res = await fetch(`${baseUrl}/api/v1/widget/${widgetId}`);
  if (res.ok) {
    return await res.json();
  } else {
    throw new Error(`Error with request: ${res.status}`);
  }
};

const getOrderBook = (baseUrl: string) => async (
  tradeableAddress: string
): Promise<OrderBookSnapshot> => {
  const res = await fetch(`${baseUrl}/api/v1/orderbook/${tradeableAddress}`);
  if (res.ok) {
    return fromJsonOrderbookSnapshot(await res.json());
  } else {
    throw new Error(`Error with request: ${res.status}`);
  }
};

export function createApi(opts: ApiOptions): ServerApi {
  return {
    getWidgetConfig: getWidgetConfig(opts.url),
    getOrderBook: getOrderBook(opts.url)
  };
}
