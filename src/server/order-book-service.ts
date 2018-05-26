import {
  HydroWatcher,
  HydroListener,
  Orderbook,
  PriceLevel,
  Side,
  ChannelName,
  Market,
  HydroClient,
  Order,
  OrderbookLevel
} from "@hydro-protocol/sdk";
import { BigNumber } from "bignumber.js";
import { RBTree } from "bintrees";

const client = HydroClient.withoutAuth();

export interface Token {
  symbol: string;
  decimals: number;
  address: string;
}

export async function getOrderbook(marketId: string) {
  const obRes = await client.getOrderbook(marketId, OrderbookLevel.THREE);
  // console.log(JSON.stringify(obRes, null, 2));
  return obRes;
}

//  MARKET DATA:
// {
//   "id": "ABT-ETH",
//   "quoteToken": "ABT",
//   "quoteTokenDecimals": 18,
//   "quoteTokenAddress": "0xb98d4c97425d9908e66e53a6fdf673acca0be986",
//   "baseToken": "ETH",
//   "baseTokenDecimals": 18,
//   "baseTokenAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//   "minOrderSize": "100.000000000000000000",
//   "maxOrderSize": "4931.539990904282435005",
//   "pricePrecision": 5,
//   "priceDecimals": 8,
//   "amountDecimals": 8
// },

export async function getTokens(): Promise<Token[]> {
  const markets = await client.listMarkets();
  return markets.map(m => ({
    symbol: m.quoteToken,
    address: m.quoteTokenAddress,
    decimals: m.quoteTokenDecimals
  }));
}

export class SimpleOrderbook {
  private asks: RBTree<Order>;
  private bids: RBTree<Order>;
  private watcher: HydroWatcher;
  private client: HydroClient;
  private market: Market;

  constructor() {
    // Sort ascending
    this.asks = new RBTree(
      (a: Order, b: Order) =>
        a.price.gt(b.price) ? 1 : a.price.eq(b.price) ? 0 : -1
    );
    // Sort descending
    this.bids = new RBTree(
      (a: Order, b: Order) =>
        a.price.gt(b.price) ? -1 : a.price.eq(b.price) ? 0 : 1
    );

    this.watcher = new HydroWatcher(this.getListener());
    this.client = HydroClient.withoutAuth();
    this.client.getOrderbook("ZRX-ETH", OrderbookLevel.THREE).then(ob => {
      console.log(JSON.stringify(ob, null, 2));
    });
    this.market = new Market({});
  }

  public async run(marketId: string) {
    this.market = await this.client.getMarket(marketId);
    // this.watcher.subscribe(ChannelName.FULL, [marketId]);
  }

  private getListener(): HydroListener {
    return {
      fullSnapshot: (orderbook: Orderbook) => {
        // Populate the trees
        this.asks.clear();
        this.bids.clear();

        console.log(JSON.stringify(orderbook, null, 2));
        process.exit(0);

        (orderbook.asks as Order[]).forEach((ask: Order) =>
          this.asks.insert(ask)
        );
        (orderbook.bids as Order[]).forEach((bid: Order) =>
          this.bids.insert(bid)
        );

        // this.printOrderbook();
      }
    };
  }

  private printOrderbook() {
    let it, item;

    const asks: Order[] = [];
    it = this.asks.iterator();
    while ((item = it.next()) !== null && asks.length < 10) {
      asks.unshift(item);
    }

    const bids: Order[] = [];
    it = this.bids.iterator();
    while ((item = it.next()) !== null && bids.length < 10) {
      bids.push(item);
    }

    console.clear();
    console.log("\x1b[37m", this.market.id);
    console.log(
      "\x1b[37m",
      "".padStart(10),
      "Price".padStart(20),
      "Amount".padStart(20)
    );
    console.log(JSON.stringify(asks[0], null, 2));
    // asks.forEach((ask: Order) =>
    //   console.log(
    //     "\x1b[31m",
    //     "".padStart(10),
    //     ask.
    //     ask.price.toFixed(this.market.priceDecimals).padStart(20),
    //     ask.amount.toFixed(this.market.amountDecimals).padStart(20)
    //   )
    // );
    // console.log(
    //   "\x1b[37m",
    //   "Spread".padEnd(10),
    //   asks[asks.length - 1].price
    //     .minus(bids[0].price)
    //     .toFixed(this.market.priceDecimals)
    //     .padStart(20)
    // );
    // bids.forEach((bid: Order) =>
    //   console.log(
    //     "\x1b[32m",
    //     "".padStart(10),
    //     bid.price.toFixed(this.market.priceDecimals).padStart(20),
    //     bid.amount.toFixed(this.market.amountDecimals).padStart(20)
    //   )
    // );
  }
}

const print = (x: any) => console.log(JSON.stringify(x, null, 2));
async function main() {
  const markets = await client.listMarkets();

  print(markets);
}
if (require.main === module) {
  main();
}
