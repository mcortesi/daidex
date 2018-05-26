import * as React from 'react';
import { RenderMapper } from '.';
import { Address, Operation } from '../../model/base';
import { Token } from '../../model/widget';
import { networkFee, txDAIVolume } from '../../model/widget-state/selectors';
import './../Widget.css';

export interface TradeProgressScreen {
  operation: Operation;
  tradeable: Token;
  amount: string;
  fromAddress: Address;
  daiVolume: string;
  networkFee: { ether: string; usd: string };
  txHash: string | null;
}

export const mapper: RenderMapper<TradeProgressScreen> = store => ws => ({
  tradeable: ws.tradeable,
  fromAddress: ws.walletDetails!.address!,
  amount: ws.amount,
  operation: ws.operation,
  daiVolume: txDAIVolume(ws),
  networkFee: networkFee(ws),
  txHash: ws.tradeTxHash,
});

const TradeProgressScreen: React.SFC<TradeProgressScreen> = props => (
  <div className="widget-status">
    {props.txHash ? (
      <h1 className="waiting">Trade: Waiting tx mining</h1>
    ) : (
      <h1 className="waiting">Trade: Waiting Confirmation</h1>
    )}
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
      <dt className="label">DAI Amount</dt>
      <dd className="value">{props.daiVolume}</dd>
      <hr />
      <dt className="label">Network Fee</dt>
      <dd className="value">
        {props.networkFee.ether} ETH / {props.networkFee.usd} USD
      </dd>
    </dl>
    {props.txHash && (
      <React.Fragment>
        <p className="label">Transaction Hash</p>
        <a className="link" href="#">
          {props.txHash}
        </a>
      </React.Fragment>
    )}
    <hr />
  </div>
);

export { TradeProgressScreen as Screen };
