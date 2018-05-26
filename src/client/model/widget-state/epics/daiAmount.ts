import { combineLatest, of, never, from } from 'rxjs';
import { distinctUntilChanged, map, switchMap, withLatestFrom, startWith } from 'rxjs/operators';
import { WidgetEpic } from '.';
import { setWalletDetails, setDAIVolume } from '../actions';
import { select, promiseFactory } from '../../../utils/rx';
import { txEtherRange } from '../selectors';
import { BN } from 'bn.js';

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
      if (
        before.volumeEth === current.volumeEth ||
        (before.volumeEth !== null &&
          current.volumeEth !== null &&
          before.volumeEth.eq(current.volumeEth))
      ) {
        return true;
      }

      if (before.wallet === current.wallet) {
        return true;
      }

      if (before.operation === current.operation) {
        return true;
      }
      return false;
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
