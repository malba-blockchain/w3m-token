// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WethPriceDataFeedMock {

  uint80 roundID;
  int256 answer;
  uint startedAt;
  uint timeStamp;
  uint80 answeredInRound;
    
  constructor( ) {
      roundID = 36893488147419306134;
      answer = 205980593600;
      startedAt = 1700088391;
      timeStamp = 1700088391;
      answeredInRound = 36893488147419306134;
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
    return 'ETH / USD';
  }
    
}