import * as React from 'react';
import Select, { Option } from 'react-select';
import 'react-select/dist/react-select.css';
import { toEther } from '../model/units';
import { Wallet } from '../model/wallets';
import { WalletDetails } from '../model/widget-state';

export interface WalletSelectorProps {
  walletDetails: WalletDetails | null;
  selectedWallet: Wallet | null;
}

class WalletSelector extends React.Component<WalletSelectorProps> {
  render() {
    const { walletDetails, selectedWallet } = this.props;

    return (
      <div className="margin-bottom">
        <div className="wallet-selector-wrapper flex-grid">
          {selectedWallet ? (
            <div className="col select-symbol-name">
              <span className="wallet-name">{selectedWallet.name} </span>
              <img className="wallet-symbol" src="https://metamask.io/img/metamask.png" alt="dai" />
            </div>
          ) : (
            <div className="col select-symbol-name">
              <span className="wallet-name">You don't have a connected wallet</span>
            </div>
          )}
          <div className="wallet-info">
            {walletDetails && (
              <React.Fragment>
                <p className="wallet-amount">
                  You have{' '}
                  <span className="wallet-amount-value">
                    {toEther(walletDetails.etherBalance)} ethers
                  </span>
                </p>
                <p className="wallet-id">{walletDetails.address}</p>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default WalletSelector;
