import * as React from 'react';
import { RenderMapper } from '.';
import { Address, Operation } from '../../model/base';
import { networkFee, txEtherRange } from '../../model/widget-state/selectors';
import './../Widget.css';
import { Token } from '../../model/widget';

export interface TradeSuccessScreenProps {
  operation: Operation;
  tradeable: Token;
  amount: string;
  fromAddress: Address;
  txEtherRange: { min: string; max: string };
  networkFee: { ether: string; usd: string };
  tradeTxHash: string;
}

export const mapper: RenderMapper<TradeSuccessScreenProps> = store => ws => {
  return {
    tradeable: ws.tradeable,
    fromAddress: ws.walletDetails!.address!,
    amount: ws.amount,
    operation: ws.operation,
    txEtherRange: txEtherRange(ws),
    networkFee: networkFee(ws),
    tradeTxHash: ws.tradeTxHash!,
  };
};

const TradeSuccessScreen: React.SFC<TradeSuccessScreenProps> = props => (
  <div className="widget-status">
    <h1 className="success">Finished!!!!!</h1>
    <h2>The trade was an outstanding success!!!</h2>
    <dl>
      <dt className="label">Operation</dt>
      <dd className="value">{props.operation}</dd>
      <hr />
      <dt className="label">Wallet Account Address</dt>
      <dd className="value">{props.fromAddress}</dd>
      <hr />
      <dt className="label">Token</dt>
      <dd className="value">{props.tradeable.symbol}</dd>
      <hr />
      <dt className="label">Token Amount</dt>
      <dd className="value">{props.amount}</dd>
      <hr />
      <dt className="label">Ether Range</dt>
      <dd className="value">
        [{props.txEtherRange.min} - {props.txEtherRange.max}]
      </dd>
      <hr />
      <dt className="label">Network Fee</dt>
      <dd className="value">
        {props.networkFee.ether} ETH / {props.networkFee.usd} USD
      </dd>
    </dl>
    <hr />
    <p className="label">Transaction Hash</p>
    <a className="link" href="#">
      {props.tradeTxHash}
    </a>
  </div>
);

export { TradeSuccessScreen as Screen };
