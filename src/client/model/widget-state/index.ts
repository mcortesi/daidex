import { BN } from "bn.js";
import { Address, Operation } from "../base";
import { OrderBook, TransactionInfo } from "../orderbook";
import { ApiOptions, createApi } from "../server-api";
import { Wallet, getWallets } from "../wallets";
import { GasPrice, WidgetConfig, Token } from "../widget";
import * as actions from "./actions";
import rootEpic from "./epics";
import { reducerWithDefaults } from "./reducer";
import { Store, createStore } from "./store";

//-------------------------------------------------------------------------------------------------
// Types
//-------------------------------------------------------------------------------------------------

export type WidgetScreen =
  | "form"
  | "error"
  | "tradeSuccess"
  | "signatureTrade"
  | "signatureApproval"
  | "waitingApproval"
  | "rejectedSignature"
  | "waitingTrade";

export interface WalletDetails {
  address: Address;
  etherBalance: BN;
  tradeableBalance: BN | null;
}

export interface WidgetState {
  config: WidgetConfig;
  operation: Operation;
  tradeable: Token;
  wallet: null | Wallet;
  amountPristine: boolean;
  amount: string; // expressed in Tokens #
  orderbook: OrderBook | null;
  gasPrice: GasPrice;
  screen: WidgetScreen;
  walletDetails: null | WalletDetails;
  isValidAmount: boolean;
  currentTransaction: TransactionInfo | null;
  tradeTxHash: null | string;
  approvalTxHash: null | string;
}

export type WidgetStore = Store<WidgetState, actions.Actions>;

export interface Operations {
  setOperation: (operation: Operation) => void;
  setToken: (token: Token) => void;
  setWallet: (wallet: Wallet | null) => void;
  setAmount: (amount: string) => void;
  setGasPrice: (gasPrice: GasPrice) => void;
  startTransaction: () => void;
}

//-------------------------------------------------------------------------------------------------
// Store Initialization
//-------------------------------------------------------------------------------------------------

export async function initWidget(apiOpts: ApiOptions, widgetId: string) {
  const api = createApi(apiOpts);
  const config: WidgetConfig = await api.getWidgetConfig(widgetId);
  config.wallets = await getWallets();

  const initialState: WidgetState = {
    config,
    operation: "buy",
    tradeable: config.tokens[0],
    wallet: config.wallets.length > 0 ? config.wallets[0] : null,
    amountPristine: true,
    amount: "0", // expressed in Tokens #
    orderbook: null,
    gasPrice: GasPrice.Normal,
    screen: "form",
    walletDetails: null,
    isValidAmount: false,
    currentTransaction: null,
    tradeTxHash: null,
    approvalTxHash: null
  };

  return createStore(reducerWithDefaults(initialState), rootEpic(api));
}
