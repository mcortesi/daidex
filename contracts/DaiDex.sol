pragma solidity 0.4.24;

//import "zos-lib/contracts/migrations/Migratable.sol";


contract IStandardToken {
  function transfer(address to, uint256 value) public returns (bool) {}
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {}
  function approve(address _spender, uint256 _value) public returns (bool) {}
}

contract IWeth is IStandardToken {
    function deposit() public payable {}
    function withdraw(uint wad) public {}
}

contract IDaiMatchingMarket {
    function sellAllAmount(IStandardToken pay_gem, uint pay_amt, IStandardToken buy_gem, uint min_fill_amount) public returns (uint fill_amt) {}
    function buyAllAmount(IStandardToken buy_gem, uint buy_amt, IStandardToken pay_gem, uint max_fill_amount) public returns (uint fill_amt) {}
}

contract IDexdex {
    function buy(IStandardToken tradeable, uint volume, bytes ordersData, address destinationAddr, address affiliate
    ) external payable {}

    function sell(IStandardToken tradeable,
    uint volume,
    uint volumeEth,
    bytes ordersData,
    address destinationAddr,
    address affiliate
  ) external {}
}

contract DaiDex /*is Migratable*/ {
      IDaiMatchingMarket daiMatchingMarket = IDaiMatchingMarket(0x14fbca95be7e99c15cc2996c6c9d841e54b79425);
      IDexdex dexdex = IDexdex(0x0c577fBF29f8797D9D29A33dE59001B872a1d4dc);
      IStandardToken dai = IStandardToken(0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359);
      IWeth weth = IWeth(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);



  /*
   * Buys ECR20 Token using DAI, only if the exchanged amount of DAI to ETH doesn't exceed a given ETH amount.
   */
  function buy(IStandardToken tokenToBuy, uint volumeTokenToBuy, uint volumeDai, uint volumeEth, bytes ordersData) {
    // Obtain Dai From Sender. Sender previously executed a transaction approving Dai transfer to this contract.
    require(dai.transferFrom(msg.sender, this, volumeDai));

    dai.approve(address(daiMatchingMarket), volumeDai);
    uint volumeWethEffective = daiMatchingMarket.sellAllAmount(dai, volumeDai, weth, volumeEth);
    require(volumeWethEffective >= volumeEth, "Effective Eth Volume is lower than expected");
    weth.withdraw(volumeWethEffective);

    dexdex.buy.value(volumeWethEffective)(tokenToBuy, volumeTokenToBuy, ordersData, msg.sender, address(0));

  }

  function sell(IStandardToken tokenToSell, uint volumeTokenToSell, uint volumeDai, uint volumeEth, bytes ordersData) {

    require(tokenToSell.transferFrom(msg.sender, this, volumeTokenToSell));

    tokenToSell.approve(address(dexdex), volumeTokenToSell);
    dexdex.sell(tokenToSell, volumeTokenToSell, volumeEth, ordersData, this, address(0));

    weth.deposit.value(volumeEth)();
    weth.approve(address(daiMatchingMarket), volumeEth);
    uint volumeDaiEffective = daiMatchingMarket.buyAllAmount(dai, volumeDai, weth, volumeEth);
    require(volumeDaiEffective >= volumeDai);

    require(dai.transfer(msg.sender, volumeDaiEffective));
  }


}