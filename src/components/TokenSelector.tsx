import * as React from 'react';
import Select, { Option } from 'react-select';
import 'react-select/dist/react-select.css';
import { Operation } from '../model/base';
import { Token } from '../model/widget';

export interface TokenSelectorProps {
  operation: Operation;
  tokens: Token[];
  selectedToken: Token;
  onChange: (token: Token) => void;
}

class TokenSelector extends React.PureComponent<TokenSelectorProps> {
  valueRenderer = (option: Option<number>) => {
    const token = this.props.tokens[option.value!];
    return (
      <div className="select-symbol-name">
        <img
          className="token-symbol"
          src={`https://easytrade.io/assets/tokens/${token.symbol.toLowerCase()}.png`}
          alt={token.symbol}
        />
        <span className="token-name"> {token.symbol}</span>
      </div>
    );
  };

  optionRenderer = (option: Option<number>) => {
    const token = this.props.tokens[option.value!];
    return (
      <div className="select-icon-name">
        <img
          className="token-symbol"
          src={`https://easytrade.io/assets/tokens/${token.symbol.toLowerCase()}.png`}
          alt={token.symbol}
        />
        <span className="token-name"> {token.symbol}</span>
      </div>
    );
  };

  render() {
    const { tokens, onChange, selectedToken } = this.props;

    return (
      <Select
        className="token-selector col"
        name="token"
        clearable={false}
        searchable={false}
        optionRenderer={this.optionRenderer}
        valueRenderer={this.valueRenderer}
        value={selectedToken ? tokens.indexOf(selectedToken) : -1}
        onChange={selected => {
          if (selected && !Array.isArray(selected)) {
            const idx = Number(selected.value);
            onChange(tokens[idx]);
          }
        }}
        options={tokens.map((token, idx) => ({
          value: idx,
          label: `{token.symbol} - {token.symbol}`,
        }))}
      />
    );
  }
}

export default TokenSelector;
