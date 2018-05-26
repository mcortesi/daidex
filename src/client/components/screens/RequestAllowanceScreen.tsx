import * as React from 'react';
import { RenderMapper } from '.';
import { Address, Operation } from '../../model/base';

import {
  networkFee,
  txEtherRange,
  txDAIVolume,
  getAllowanceTxHash,
  RequestAllowanceProps,
} from '../../model/widget-state/selectors';
import './../Widget.css';
import { Token } from '../../model/widget';
import { WidgetState } from '../../model/widget-state';

const RequestAllowanceScreen: React.SFC<RequestAllowanceProps> = props => (
  <div className="widget-status">
    {props.txHash ? (
      <h1 className="waiting">Waiting tx mining</h1>
    ) : (
      <h1 className="waiting">Approve us to trade on your behalf</h1>
    )}
    <dl>
      <dt className="label">Token</dt>
      <dd className="value">{props.tokenSymbol}</dd>
      <hr />
      <dt className="label">Volume</dt>
      <dd className="value">{props.volume}</dd>
      <hr />
      {props.txHash && (
        <React.Fragment>
          <dt className="label">Transaction</dt>
          <dd className="value">{props.txHash}</dd>
          <hr />
        </React.Fragment>
      )}
    </dl>
  </div>
);

export { RequestAllowanceScreen as Screen };
