pragma solidity 0.4.24;

import "zos-lib/contracts/migrations/Migratable.sol";

contract DaiDex is Migratable {
  uint256 public x;

  function initialize(uint256 _x) isInitializer("DaiDex", "0") public {
    x = _x;
  }
}