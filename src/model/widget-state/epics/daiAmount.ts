import { BN } from 'bn.js';
import { of } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { promiseFactory } from '../../../utils/rx';
import { setDAIVolume } from '../actions';

export const daiAmount: WidgetEpic = changes =>
  changes.pipe(
    map(change => {
      return {
        volumeEth: change.state.currentTransaction
          ? change.state.currentTransaction.currentVolumeEth
          : null,
        wallet: change.state.wallet,
        operation: change.state.operation,
      };
    }),
    distinctUntilChanged((before, current) => {
      const isSameVolume =
        before.volumeEth == current.volumeEth ||
        (before.volumeEth !== null &&
          current.volumeEth !== null &&
          before.volumeEth.eq(current.volumeEth));
      const isSameWallet = before.wallet === current.wallet;
      const isSameOp = before.operation === current.operation;
      return isSameVolume && isSameWallet && isSameOp;
    }),
    switchMap(({ volumeEth, wallet, operation }) => {
      if (wallet && volumeEth) {
        return promiseFactory<BN | null>(() => wallet.daiAmount(operation, volumeEth)).pipe(
          startWith<BN | null>(null)
        );
      } else {
        return of(null);
      }
    }),
    map(setDAIVolume)
  );
