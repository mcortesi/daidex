import { BN } from 'bn.js';
import { WidgetState } from '.';
import { percentage } from '../../utils/bn-math';
import { fromWei, toTokenDecimals } from '../units';
import { computeGasPrice } from '../widget';

export const txEtherRange = (ws: WidgetState) => {
  const transactionInfo = ws.currentTransaction;

  const txPriceInEth = (p: BN) =>
    Number(fromWei(percentage(1 + ws.config.feePercentage, p), 'ether')).toFixed(4);

  return {
    min: transactionInfo ? txPriceInEth(transactionInfo.currentVolumeEth) : '--',
    max: transactionInfo ? txPriceInEth(transactionInfo.currentVolumeEthUpperBound) : '--',
  };
};

export const txDAIVolume = (ws: WidgetState) => {
  const dai = ws.currentTransactionDai;
  return dai
    ? Number(fromWei(percentage(1 + ws.config.feePercentage, dai), 'ether')).toFixed(4)
    : '--';
};

export const networkFee = (ws: WidgetState) => {
  const transactionInfo = ws.currentTransaction;
  const gasPrice = computeGasPrice(ws.config.gasprices, ws.gasPrice);
  const gasCost = transactionInfo
    ? String(Number(fromWei(transactionInfo.requiredGas.mul(gasPrice), 'ether')).toFixed(4))
    : '--';

  return {
    ether: gasCost,
    usd: transactionInfo ? String((Number(gasCost) * ws.config.ethers2usdER).toFixed(2)) : '--',
  };
};

export const amountTD = (ws: WidgetState) => toTokenDecimals(ws.amount, ws.tradeable.decimals);
