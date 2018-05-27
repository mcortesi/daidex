import { WidgetScreen, WidgetState, WidgetStore } from '../../model/widget-state';
import * as error from './ErrorScreen';
import * as form from './FormScreen';
import * as rejectedSignature from './RejectedSignature';
import { Screen as RequestAllowanceScreen } from './RequestAllowanceScreen';

import * as tradeSuccess from './TradeSuccessScreen';
import * as tradeProgress from './TradeProgressScreen';
import { getTokenAllowanceInfo, getDAIAllowanceInfo } from '../../model/widget-state/selectors';

export type RenderMapper<T> = (store: WidgetStore) => (ws: WidgetState) => T;

export type Screen<T> = {
  mapper: RenderMapper<T>;
  Screen: React.ComponentType<T>;
};
const screens: Record<WidgetScreen, Screen<any>> = {
  form: form,
  rejectedSignature: rejectedSignature,
  error: error,
  tradeSuccess: tradeSuccess,
  signatureApproval: {
    mapper: () => getTokenAllowanceInfo,
    Screen: RequestAllowanceScreen,
  },
  waitingApproval: {
    mapper: () => getTokenAllowanceInfo,
    Screen: RequestAllowanceScreen,
  },
  signatureDAIApproval: {
    mapper: () => getDAIAllowanceInfo,
    Screen: RequestAllowanceScreen,
  },
  waitingDAIApproval: {
    mapper: () => getDAIAllowanceInfo,
    Screen: RequestAllowanceScreen,
  },
  signatureTrade: tradeProgress,
  waitingTrade: tradeProgress,
};

export default screens;
