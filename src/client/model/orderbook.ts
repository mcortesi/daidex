import { BN } from 'bn.js';
import { Operation } from './base';
import { getMaxVolume, getMinVolume, getTransactionFor } from './ob-math';
import { Order } from './order';
import { toWei } from './units';

export type OrderBookConfig = {
  minVolumeEth: BN;
  maxTransactionOrders: number;
};

const DefaultConfig = {
  minVolumeEth: toWei(0.001, 'ether'),
  maxTransactionOrders: 2,
};

Object.freeze(DefaultConfig);

export interface TransactionInfo {
  /** the minim volume for the transaction with the selected orders */
  readonly requiredVolume: BN;
  /** the minim volumeEth for the transaction with the selected orders */
  readonly requiredVolumeEth: BN;

  /** extra volume available with selected orders */
  readonly extraVolume: BN;
  /** extra volumeEth available with selected orders */
  readonly extraVolumeEth: BN;

  /** The amount of extra volume already consumed (number between [0, extraVolume]) */
  readonly usedExtraVolume: BN;

  /** Selected Orders for the transaccion */
  readonly orders: Order[];
  readonly requiredGas: BN;

  readonly currentVolume: BN;
  readonly currentVolumeEth: BN;
  readonly currentVolumeEthUpperBound: BN;

  readonly maxAvailableVolume: BN;
  readonly maxAvailableVolumeEth: BN;

  canHandle(volume: BN): Boolean;
  changeVolume(newVolume: BN): void;

  getOrderParameters(): string;
  // requiredGasAmount: number;
  /**
   * Computes the gas cost of the operation
   * @param amount selected amount (in eth)
   * @param gasPrice selected gas price (in gwei)
   * @returns gas cost (in eth)
   */
  // gasCost(gasPrice: number): number;
}

export interface OrderBookSide {
  orders: Order[];
  minVolume: BN;
  maxVolume: BN;
}

export interface OrderBook {
  buys: OrderBookSide;
  sells: OrderBookSide;
}

export type Updater<A> = (before: A) => A;

export const getSide = (ob: OrderBook, op: Operation): OrderBookSide =>
  op === 'buy' ? ob.sells : ob.buys;

export const updateSide = (ob: OrderBook, isSell: boolean) => (
  updater: Updater<OrderBookSide>
): OrderBook => {
  if (isSell) {
    ob.sells = updater(ob.sells);
  } else {
    ob.buys = updater(ob.buys);
  }
  return ob;
};

export const orderBookActions = (cfg: OrderBookConfig = DefaultConfig) => {
  const isValidVolume = (obside: OrderBookSide, volume: BN) =>
    volume.gte(obside.minVolume) && volume.lte(obside.maxVolume);

  const newOBSide = (orders: Order[] = []): OrderBookSide => ({
    orders: orders,
    minVolume: getMinVolume(orders, cfg.minVolumeEth),
    maxVolume: getMaxVolume(orders, cfg.maxTransactionOrders),
  });

  const newOrderBook = (
    { sells, buys }: { sells: Order[]; buys: Order[] } = { sells: [], buys: [] }
  ): OrderBook => ({
    sells: newOBSide(sells),
    buys: newOBSide(buys),
  });

  const addOrder = (o: Order): Updater<OrderBookSide> => obside =>
    newOBSide(obside.orders.concat([o]));

  const removeOrder = (o: Order): Updater<OrderBookSide> => obside => {
    const orders = obside.orders;
    const idx = orders.findIndex(order => o.id === order.id);
    if (idx >= 0) {
      const copy = orders.concat([]);
      copy.splice(idx, 1);
      return newOBSide(obside.orders);
    } else {
      return obside;
    }
  };

  const updateOrder = (o: Order): Updater<OrderBookSide> => obside => {
    const orders = obside.orders;
    const idx = orders.findIndex(order => o.id === order.id);
    if (idx >= 0) {
      const copy = orders.concat([]);
      copy[idx] = o;
      return newOBSide(obside.orders);
    } else {
      return obside;
    }
  };

  const computeTransaction = (obside: OrderBookSide, volumeTD: BN): TransactionInfo => {
    return getTransactionFor(obside.orders, cfg.maxTransactionOrders, volumeTD);
  };

  return {
    newOrderBook,
    newOBSide,
    addOrder,
    removeOrder,
    updateOrder,
    computeTransaction,
    isValidVolume,
  };
};
