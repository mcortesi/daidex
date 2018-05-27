#!/usr/bin/env node
const cli = require('./cli');
const Eth = require('ethjs-query');
const HttpProvider = require('ethjs-provider-http');
const { deployContracts } = require('./contracts');

function getHttpEth() {
  return new Eth(new HttpProvider('http://localhost:8545'));
}

const eth = getHttpEth();
deployContracts(eth, process.env.CONTRACTS_PATH, cli.info).catch(err => {
  console.log(err);
  process.exit(1);
});
