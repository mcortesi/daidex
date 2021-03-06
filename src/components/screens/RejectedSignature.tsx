import * as React from 'react';
import { RenderMapper } from '.';
import { goBack } from '../../model/widget-state/actions';
import './../Widget.css';

export interface RejectedSignatureScreenProps {
  goBack: () => void;
}

export const mapper: RenderMapper<RejectedSignatureScreenProps> = store => {
  const props = {
    goBack: () => store.dispatch(goBack()),
  };

  return ws => props;
};

const RejectedSignatureScreen: React.SFC<RejectedSignatureScreenProps> = props => (
  <div className="widget-status">
    <h1 className="error">You rejected us... :(</h1>
    <h2>should we start again?</h2>
    <button onClick={props.goBack}>Go Gack</button>
  </div>
);

export { RejectedSignatureScreen as Screen };
