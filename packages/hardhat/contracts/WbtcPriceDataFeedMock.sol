// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WbtcPriceDataFeedMock {

  uint80 roundID;
  int256 answer;
  uint startedAt;
  uint timeStamp;
  uint80 answeredInRound;
    
  constructor( ) {
      roundID = 36893488147419305703;
      answer = 3776334785000;
      startedAt = 1700087953;
      timeStamp = 1700087953;
      answeredInRound = 36893488147419305703;
  }

  function latestRoundData() public view
    returns (
      uint80 _roundId,
      int256 _answer,
      uint256 _startedAt,
      uint _updatedAt,
      uint80 _answeredInRound
    )
  {
    return (roundID, answer, startedAt, timeStamp, answeredInRound);
  }

  function description() external pure returns (string memory) {
    return 'WBTC / USD';
  }
    
}