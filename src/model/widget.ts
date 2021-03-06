import { toWei } from './units';
import { Wallet } from './wallets';
import { BN } from 'bn.js';

export enum GasPrice {
  Slow = 'Slow',
  Normal = 'Normal',
  Fast = 'Fast',
}

export interface GasPrices {
  slow: number;
  normal: number;
  fast: number;
}

export interface Token {
  symbol: string;
  decimals: number;
  address: string;
}

export interface WidgetConfig {
  feePercentage: number;
  ethers2usdER: number;
  gasprices: GasPrices;
  tokens: Token[];
  wallets: Wallet[];
}

export enum TxStage {
  Idle = 'Idle',
  SignatureRejected = 'SignatureRejected',
  RequestDAIAllowanceSignature = 'RequestDAIAllowanceSignature',
  DAIAllowanceInProgress = 'DAIAllowanceInProgress',
  RequestTokenAllowanceSignature = 'RequestTokenAllowanceSignature',
  TokenAllowanceInProgress = 'TokenAllowanceInProgress',
  RequestTradeSignature = 'RequestTradeSignature',
  TradeInProgress = 'TradeInProgress',
  Completed = 'Completed',
  Failed = 'Failed',
}
export type TransactionState =
  | { stage: TxStage.Idle }
  | {
      stage:
        | TxStage.RequestTradeSignature
        | TxStage.RequestDAIAllowanceSignature
        | TxStage.RequestTokenAllowanceSignature;
    }
  | {
      stage:
        | TxStage.TradeInProgress
        | TxStage.DAIAllowanceInProgress
        | TxStage.TokenAllowanceInProgress;
      txId: string;
    }
  | { stage: TxStage.Completed }
  | { stage: TxStage.SignatureRejected }
  | { stage: TxStage.Failed };

export function computeGasPrice(prices: GasPrices, price: GasPrice): BN {
  switch (price) {
    case GasPrice.Slow:
      return toWei(prices.slow, 'gwei');
    case GasPrice.Normal:
      return toWei(prices.normal, 'gwei');
    case GasPrice.Fast:
      return toWei(prices.fast, 'gwei');
    default:
      throw new Error(`invalid gas price ${price}`);
  }
}
