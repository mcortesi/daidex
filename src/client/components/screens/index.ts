import { WidgetScreen, WidgetState, WidgetStore } from '../../model/widget-state';
import * as error from './ErrorScreen';
import * as form from './FormScreen';
import * as rejectedSignature from './RejectedSignature';
import * as signatureApproval from './SignatureApprovalScreen';
import * as signatureTrade from './SignatureTradeScreen';
import * as tradeSuccess from './TradeSuccessScreen';
import * as waitingApproval from './WaitingApprovalScreen';
import * as waitingTrade from './WaitingTradeScreen';

export type RenderMapper<T> = (store: WidgetStore) => (ws: WidgetState) => T;

export type Screen<T> = {
  mapper: RenderMapper<T>;
  Screen: React.ComponentType<T>;
};
const screens: Record<WidgetScreen, Screen<any>> = {
  form: form,
  signatureTrade: signatureTrade,
  waitingTrade: waitingTrade,
  rejectedSignature: rejectedSignature,
  error: error,
  tradeSuccess: tradeSuccess,
  waitingApproval: waitingApproval,
  signatureApproval: signatureApproval,
  waitingDAIApproval: waitingApproval,
  signatureDAIApproval: signatureApproval,
};

export default screens;
