import * as React from "react";
import Select, { Option } from "react-select";
import "react-select/dist/react-select.css";
import { toEther } from "../model/units";
import { Wallet } from "../model/wallets";
import { WalletDetails } from "../model/widget-state";

export interface WalletSelectorProps {
  wallets: Wallet[];
  walletDetails: WalletDetails | null;
  selectedWallet: Wallet | null;
  onChange: (selected: Wallet | null) => void;
}

class WalletSelector extends React.Component<WalletSelectorProps> {
  valueRenderer = (option: Option<number>) => {
    if (option.value == null || option.value === -1) {
      return (
        <div className="select-symbol-name">
          <img
            className="wallet-symbol"
            src="https://metamask.io/img/metamask.png"
            alt="dai"
          />
          <span className="wallet-name"> NO WALLET</span>
        </div>
      );
    } else {
      const wallet = this.props.wallets[option.value!];
      return (
        <div className="select-symbol-name">
          <img
            className="wallet-symbol"
            src="https://metamask.io/img/metamask.png"
            alt="dai"
          />
          <span className="wallet-name"> {wallet.name}</span>
        </div>
      );
    }
  };

  optionRenderer = (option: Option<number>) => {
    const wallet = this.props.wallets[option.value!];
    return (
      <div className="select-icon-name">
        <img
          className="wallet-symbol"
          src="https://metamask.io/img/metamask.png"
          alt="dai"
        />
        <span className="wallet-name"> {wallet.name}</span>
      </div>
    );
  };

  render() {
    const { wallets, walletDetails, selectedWallet, onChange } = this.props;

    return (
      <div className="margin-bottom">
        <label className="FormControl_Label flex-grid" htmlFor="wallet">
          Wallet
        </label>
        <div className="wallet-selector-wrapper flex-grid">
          <Select
            className="col"
            name="wallet"
            clearable={false}
            searchable={false}
            optionRenderer={this.optionRenderer}
            valueRenderer={this.valueRenderer}
            value={selectedWallet ? wallets.indexOf(selectedWallet) : -1}
            onChange={selected => {
              if (selected && !Array.isArray(selected)) {
                const idx = Number(selected.value);
                onChange(wallets[idx]);
              } else {
                onChange(null);
              }
            }}
            options={wallets.map((w, idx) => ({
              value: idx,
              label: w.name
            }))}
          />
          <div className="wallet-info">
            {walletDetails && (
              <React.Fragment>
                <p className="wallet-amount">
                  You have{" "}
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
