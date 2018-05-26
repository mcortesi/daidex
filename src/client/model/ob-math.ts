import { BN } from 'bn.js';
import { assert } from '../utils/assert';
import { Order, getOrderRemainingVolume, getOrderRemainingVolumeEth } from './order';
import { TransactionInfo } from './orderbook';

export class StdTransactionInfo implements TransactionInfo {
  /** the minim volume for the transaction with the selected orders */
  public readonly requiredVolume: BN;
  /** the minim volumeEth for the transaction with the selected orders */
  public readonly requiredVolumeEth: BN;

  /** extra volume available with selected orders */
  public readonly extraVolume: BN;
  /** extra volumeEth available with selected orders */
  public readonly extraVolumeEth: BN;

  /** The amount of extra volume already consumed (number between [0, extraVolume]) */
  public usedExtraVolume: BN;

  /** Selected Orders for the transaccion */
  public readonly orders: Order[];

  constructor(opts: {
    requiredVolume: BN;
    requiredVolumeEth: BN;
    extraVolume: BN;
    extraVolumeEth: BN;
    orders: Order[];
  }) {
    this.requiredVolume = opts.requiredVolume;
    this.requiredVolumeEth = opts.requiredVolumeEth;
    this.extraVolume = opts.extraVolume;
    this.extraVolumeEth = opts.extraVolumeEth;
    this.orders = opts.orders;

    this.usedExtraVolume = new BN(0);
  }

  get requiredGas() {
    return new BN(500000).muln(this.orders.length);
  }

  get currentVolume() {
    return this.requiredVolume.add(this.usedExtraVolume);
  }

  get currentVolumeEth() {
    if (this.extraVolume.isZero()) {
      return this.requiredVolumeEth;
    } else {
      return this.requiredVolumeEth.add(
        this.extraVolumeEth.mul(this.usedExtraVolume).div(this.extraVolume)
      );
    }
  }

  get currentVolumeEthUpperBound() {
    // Current threshold is 5% extra
    return this.currentVolumeEth.muln(105).divn(100);
  }

  get maxAvailableVolume() {
    return this.requiredVolume.add(this.extraVolume);
  }
  get maxAvailableVolumeEth() {
    return this.requiredVolumeEth.add(this.extraVolumeEth);
  }

  canHandle(volume: BN): boolean {
    return (
      volume.gte(this.requiredVolume) && volume.lte(this.requiredVolume.add(this.extraVolumeEth))
    );
  }

  changeVolume(newVolume: BN) {
    assert(this.canHandle(newVolume), `Invalid volume for Transaction: ${newVolume.toString()}`);
    this.usedExtraVolume = newVolume.sub(this.requiredVolume);
  }

  getOrderParameters() {
    return this.orders.map(o => o.ordersData).join('');
  }
}

function findMinVolumeIdx(orders: Order[]): number {
  let lowest = getOrderRemainingVolume(orders[0]);
  let lowestIdx = 0;
  for (let i = 1; i < orders.length; i++) {
    const remaining = getOrderRemainingVolume(orders[i]);
    if (lowest.gt(remaining)) {
      lowest = remaining;
      lowestIdx = i;
    }
  }
  return lowestIdx;
}

function applyOrder(order: Order, requiredVolume: BN) {
  const volume = getOrderRemainingVolume(order);
  const volumeEth = getOrderRemainingVolumeEth(order);

  if (requiredVolume.gte(volume)) {
    return { volume, volumeEth, extraVolume: new BN(0), extraVolumeEth: new BN(0) };
  } else {
    const propotionalVolumeEth = volumeEth.mul(requiredVolume).div(volume);
    return {
      volume: requiredVolume,
      volumeEth: propotionalVolumeEth,
      extraVolume: volume.sub(requiredVolume),
      extraVolumeEth: volumeEth.sub(propotionalVolumeEth),
    };
  }
}

export function getTransactionFor(
  orders: Order[],
  ordersQty: number,
  totalVolume: BN
): StdTransactionInfo {
  if (orders.length === 0) {
    return new StdTransactionInfo({
      requiredVolume: new BN(0),
      requiredVolumeEth: new BN(0),
      extraVolume: new BN(0),
      extraVolumeEth: new BN(0),
      orders: [],
    });
  }

  let accVolume = new BN(0);
  let accVolumeEth = new BN(0);
  let selectedOrders: Order[] = [];

  for (const order of orders) {
    // if next order will surpass qty, we first remove an order.
    if (selectedOrders.length >= ordersQty) {
      const idxToRemove = findMinVolumeIdx(selectedOrders);
      const [deletedOrder] = selectedOrders.splice(idxToRemove, 1);
      accVolume = accVolume.sub(getOrderRemainingVolume(deletedOrder));
      accVolumeEth = accVolumeEth.sub(getOrderRemainingVolumeEth(deletedOrder));
    }

    // We compute volume amounts to complete the remaining volume
    // The computed volume can be the full order or just a part of it
    const remainingVolume = totalVolume.sub(accVolume);
    const { volume, volumeEth, extraVolume, extraVolumeEth } = applyOrder(order, remainingVolume);

    // We add the order the volume to use from it, to the set.
    selectedOrders.push(order);
    accVolume = accVolume.add(volume);
    accVolumeEth = accVolumeEth.add(volumeEth);

    // If we already achieve the required volume, exit
    if (accVolume.gte(totalVolume)) {
      return new StdTransactionInfo({
        requiredVolume: accVolume,
        requiredVolumeEth: accVolumeEth,
        extraVolume,
        extraVolumeEth,
        orders: selectedOrders,
      });
    }
  }
  throw new Error("can't operate to that amount");
}

/**
 * Returns the minimun Volume using the orders so that
 * we have volumeEth as passed.
 *
 * @param orders
 * @param minVolumeEth
 * @returns minVolume in tokenDecimals
 */
export function getMinVolume(orders: Order[], minVolumeEth: BN): BN {
  // how muchs token should I buy to spend MIN_ETH_AMOUNT ?
  // tokens at best price. (in td)
  if (orders.length === 0) {
    return new BN(0);
  } else {
    const order = orders[0];
    const BIGN = new BN('100000000000000000000');

    const minVolume = minVolumeEth
      .mul(order.volume)
      .mul(BIGN)
      .div(order.volumeEth)
      .div(BIGN);

    return minVolume;
  }
}

export function getMaxVolume(orders: Order[], maxOrders: number): BN {
  const maxVolume = orders
    .map(getOrderRemainingVolume)
    .sort((v1, v2) => v2.cmp(v1))
    .slice(0, maxOrders)
    .reduce((acc, v) => v.add(acc), new BN(0));

  return maxVolume;
}

// For Testing
export { findMinVolumeIdx as _findMinVolumeIdx };
