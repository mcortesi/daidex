const chalk = require('chalk');
const unit = require('ethjs-unit');
const EthContract = require('ethjs-contract');
const fse = require('fs-extra');
const cli = require('./cli');
const path = require('path');

const ContractNames = {
  weth: 'WETH9',
  dai: 'DSToken',
  matchingMarket: 'MatchingMarket',
  daidex: 'DaiDex',
};

class ContractFactory {
  constructor(eth, contractPath, logger, txOpts) {
    this.eth = eth;
    this.contractPath = contractPath;
    this.logger = logger;
    this.txOpts = txOpts;
  }

  async deploy({ name, owner, params }) {
    const contractFactory = this.abiInterface(name);
    const txhash = await this.mineContract(contractFactory, owner, ...(params || []));
    const txreceipt = await this.eth.getTransactionReceipt(txhash);
    this.logger(chalk`Contract: {blue ${name}}. Address: {blue ${txreceipt.contractAddress}}`);

    const contract = contractFactory.at(txreceipt.contractAddress);
    return contract;
  }

  init(name, address) {
    const contractFactory = this.abiInterface(name);
    return contractFactory.at(address);
  }

  mineContract(contactFactory, owner, ...params) {
    return new Promise((resolve, reject) => {
      contactFactory.new(
        ...params.concat([
          {
            from: owner,
            gas: 6000000,
          },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          },
        ])
      );
    });
  }

  abiInterface(name) {
    const contractJson = fse.readJSONSync(path.join(this.contractPath, `./${name}.json`));

    const contractFactory = EthContract(this.eth)(contractJson.abi, contractJson.bytecode, {
      from: this.txOpts.from,
      gas: 600000,
    });
    return contractFactory;
  }
}

async function deployContracts(eth, contractsPath, logger) {
  const accounts = await eth.accounts();
  const dexdexAddress = '0xc3fa5e0027c435dd2502ae0ed6951d92bf9b4a56';

  const factory = new ContractFactory(eth, contractsPath, logger, { from: accounts[0] });

  const dai = await factory.deploy({
    name: ContractNames.dai,
    owner: accounts[0],
    params: ['0x012'],
  });
  const weth = await factory.deploy({ name: ContractNames.weth, owner: accounts[1] });
  const matchingMarket = await factory.deploy({
    name: ContractNames.matchingMarket,
    owner: accounts[0],
    params: ['1558899623'],
  });
  const daidex = await factory.deploy({
    name: ContractNames.daidex,
    owner: accounts[0],
    params: [matchingMarket.address, dexdexAddress, dai.address, weth.address],
  });

  await matchingMarket.addTokenPairWhitelist(dai.address, weth.address, {
    from: accounts[0],
    gas: 160000,
  });

  /* offer(pay_amt, pay_gem, buy_amt, buy_gem, 0); */

  /* Account 1 */
  dai.mint(accounts[0], unit.toWei('10000', 'ether'), {
    from: accounts[0],
    gas: 160000,
  });
  dai.approve(matchingMarket.address, {
    from: accounts[0],
    gas: 160000,
  });

  matchingMarket.offer(
    unit.toWei('500', 'ether'),
    dai.address,
    unit.toWei('1', 'ether'),
    weth.address,
    '0',
    false,
    {
      from: accounts[0],
      gas: 560000,
    }
  );
  matchingMarket.offer(
    unit.toWei('510', 'ether'),
    dai.address,
    unit.toWei('1', 'ether'),
    weth.address,
    '0',
    false,
    {
      from: accounts[0],
      gas: 560000,
    }
  );
  matchingMarket.offer(
    unit.toWei('520', 'ether'),
    dai.address,
    unit.toWei('1', 'ether'),
    weth.address,
    '0',
    false,
    {
      from: accounts[0],
      gas: 560000,
    }
  );
  matchingMarket.offer(
    unit.toWei('530', 'ether'),
    dai.address,
    unit.toWei('1', 'ether'),
    weth.address,
    '0',
    false,
    {
      from: accounts[0],
      gas: 560000,
    }
  );

  /* Account 2 */
  weth.deposit({
    value: unit.toWei('20', 'ether'),
    from: accounts[1],
    gas: 160000,
  });

  weth.approve(matchingMarket.address, unit.toWei('20', 'ether'), {
    from: accounts[1],
    gas: 160000,
  });

  matchingMarket.offer(
    unit.toWei('5', 'ether'),
    weth.address,
    unit.toWei('3000', 'ether'),
    dai.address,
    '0',
    false,
    {
      from: accounts[1],
      gas: 560000,
    }
  );
  matchingMarket.offer(
    unit.toWei('5', 'ether'),
    weth.address,
    unit.toWei('3010', 'ether'),
    dai.address,
    '0',
    false,
    {
      from: accounts[1],
      gas: 560000,
    }
  );
  matchingMarket.offer(
    unit.toWei('5', 'ether'),
    weth.address,
    unit.toWei('3020', 'ether'),
    dai.address,
    '0',
    false,
    {
      from: accounts[1],
      gas: 560000,
    }
  );
  matchingMarket.offer(
    unit.toWei('5', 'ether'),
    weth.address,
    unit.toWei('3030', 'ether'),
    dai.address,
    '0',
    false,
    {
      from: accounts[1],
      gas: 560000,
    }
  );

  // cuanto DAI necesito para comprar 1 ETH? = 600000000000000000000
  // const res = await matchingMarket.getPayAmount(
  //   dai.address,
  //   weth.address,
  //   unit.toWei('1', 'ether'),
  //   { from: buyer }
  // );

  // console.log('required DAI for 1eth', res[0].toString());

  // const res2 = await matchingMarket.buyAllAmount(
  //   weth.address,
  //   unit.toWei('1', 'ether'),
  //   dai.address,
  //   '600000000000000000000',
  //   { from: buyer }
  // );

  // console.log('remaining DAI after buy', res2[0].toString());

  // const buyer = accounts[2];
  // await dai.transfer(buyer, '1000000000000000000000', { from: accounts[0], gas: 160000 });

  // const daiBalanceBefore = await dai.balanceOf(buyer);
  // const wethBalanceBefore = await weth.balanceOf(buyer);
  // console.log('dai Balance', daiBalanceBefore[0].toString());
  // console.log('weth Balance', wethBalanceBefore[0].toString());
  // await dai.approve(daidex.address, {
  //   from: buyer,
  //   gas: 160000,
  // });

  // await daidex.buy(
  //   '0xb04a0e88b962dce5c4be1a47674ece99452d9dec',
  //   '5000000000000000000',
  //   '600000000000000000000', //'556000000000000000000',
  //   unit.toWei('1', 'ether'), //'900000000000000000',
  //   '0x700d4d2d7825b5668506e5d3588feb2f769a5e891f9fd8c18d179293cefae6b6214734aa05c7eca01f1fcf19a6f80ca58833d67095ee94cca897f8ef3aa7ccbb1b9e2d981edd0f4292961a77bacbb3e9cfc0c43637000000000000000000000000000000000000000000000000000001639fc85a3900000000000000000000000000000000000000000000000000000000000000830000000000000000000000000000000000000000000000008ac7230489e80000b04a0e88b962dce5c4be1a47674ece99452d9dec0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000001',
  //   {
  //     from: buyer,
  //     gas: 1560000,
  //   }
  // );

  // const daiBalanceAfter = await dai.balanceOf(buyer);
  // const wethBalanceAfter = await weth.balanceOf(buyer);
  // console.log('dai Balance', daiBalanceAfter[0].toString());
  // console.log('weth Balance', wethBalanceAfter[0].toString());
  // console.log('consumed dai', daiBalanceBefore[0].sub(daiBalanceAfter[0]).toString());

  return {
    daidex,
    matchingMarket,
    dai,
    weth,
  };
}

async function getDeployedContracts(eth, contractsPath, logger) {
  const accounts = await eth.accounts();
  const factory = new ContractFactory(eth, contractsPath, logger, { from: accounts[0] });
  const addresses = readContractsJson();

  const contracts = {};
  Object.keys(ContractNames).forEach(key => {
    contracts[key] = factory.init(ContractNames[key], addresses[key]);
  });
  return contracts;
}

module.exports.deployContracts = deployContracts;
module.exports.getDeployedContracts = getDeployedContracts;
