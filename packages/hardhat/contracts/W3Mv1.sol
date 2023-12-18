// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

interface MaticTokenInterface {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
}

interface UsdcTokenInterface {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
}

contract W3Mv1 is ERC20Pausable, Ownable {

    ////////////////// SMART CONTRACT EVENTS //////////////////

    event TokenEmission(address sender, uint256 amount);

    event InvestFromMatic(address sender, uint256 maticAmount, uint256 w3mAmount);

    event InvestFromUsdc(address sender, uint256 usdcAmount, uint256 w3mAmount);

    event UpdatedW3mPerUSD(uint256 _newW3mPerUSD);

    event UpdatedMaticPriceFeedAddress(address _newMaticPriceFeedAddress);

    event UpdatedUsdcTokenAddress(address _newUsdcTokenAddress);
    event UpdatedUsdcPriceFeedAddress(address _newUsdcPriceFeedAddress);

    ////////////////// SMART CONTRACT VARIABLES //////////////////

    //Represent the amount of tokens to give in exchange for 1 USD
    uint256 public w3mPerUSD;


    //////////MATIC VARIABLES//////////
    
    //There is no implementation of MATIC token address in the blockchain. Because its the native token of the Polygon Blockchain

    //Address of MATIC token price feed (Oracle) in the blockchain
    address public maticPriceFeedAddress;

    //Aggregator that allows to ask for the price of crypto tokens
    AggregatorV3Interface internal dataFeedMatic;


    /////////////USDC VARIABLES//////////

    //Address of USDC token in the blockchain
    address public usdcTokenAddress;

    //Address of USDC token price feed (Oracle) in the blockchain
    address public usdcPriceFeedAddress;

    //Aggregator that allows to ask for the price of crypto tokens
    AggregatorV3Interface internal dataFeedUsdc;

    //Declaration of USDC token interface
    UsdcTokenInterface public usdcToken;


    ////////////////// SMART CONTRACT CONSTRUCTOR /////////////////
    constructor() ERC20("W3MToken", "W3M") Ownable()
    {   
        _mint(msg.sender, 2000000000 * 10 ** decimals());

        //Setting the amount of tokens to give in exchange for 1 USD
        w3mPerUSD = 166;


        //There is no implementation of MATIC token interface. Because its the native token of the Polygon Blockchain
        //Address of MATIC token price feed (Oracle) in the blockchain
        maticPriceFeedAddress = 0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada;

        //Oracle on Mumbai network for MATIC/USD https://mumbai.polygonscan.com/address/0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada
        dataFeedMatic = AggregatorV3Interface(maticPriceFeedAddress);


        //Address of USDC token in the blockchain
        usdcTokenAddress = 0x19a09c6fd7f643b9515C4FfC0B234B5bFc0F2E0F;

        //Address of USDC token price feed (Oracle) in the blockchain
        usdcPriceFeedAddress = 0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0;

        //Oracle on Mumbai network for USDC/USD https://mumbai.polygonscan.com/address/0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0
        dataFeedUsdc = AggregatorV3Interface(usdcPriceFeedAddress);

        //Implementation of USDC token interface
        usdcToken = UsdcTokenInterface(usdcTokenAddress);
    }

    ////////////////// SMART CONTRACT FUNCTIONS //////////////////

    //Token emission function
    function tokenEmission(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Amount of W3M tokens to emmit must be greater than zero");
        _mint(owner(), _amount);
        emit TokenEmission(msg.sender, _amount);
    }

    /////////////INVESTING FUNCTIONS//////////

    function investFromMatic() public payable returns (bool){

        //Transfer MATIC to this contract. Its automatically done with the payable tag
        //Amount to transfer should greater than zero
        require(msg.value > 0, "Amount of MATIC to invest should be greater than 0");

        //Get the current Matic price from function
        uint256 currentMaticPrice = this.getCurrentMaticPrice();

        //Calculate the total investment in USD and divide by 10**8. Because the MATIC price feed comes with 8 decimals
        uint256 totalInvestmentInUsd = (msg.value * currentMaticPrice) / 100000000; 

        //Calcuale the amount of tokens to return given the current token price
        uint256 totalW3mTokenToReturn = totalInvestmentInUsd * w3mPerUSD;

        //Validate that the amount of W3M tokens to offer to the investor is equal or less than the amount that's left in the smart contract
        require (totalW3mTokenToReturn <= this.balanceOf(address(this)), "The amount of W3M tokens to buy must be equal or less than the tokens available");

        //Transfer MATIC to the owner wallet
        bool successSendingMatic = payable(owner()).send(msg.value);
        require (successSendingMatic, "There was an error on sending the MATIC investment to the owner");

        //Transfer W3M token to the investor wallet
        bool successSendingW3mToken = this.transfer(msg.sender, totalW3mTokenToReturn);
        require (successSendingW3mToken, "There was an error on sending back the W3M Token to the investor");

        //Emit the event of successful investment
        emit InvestFromMatic(msg.sender, msg.value, totalW3mTokenToReturn);

        return successSendingW3mToken;
    }


    function investFromUsdc(uint256 _amount) public returns (bool) {

        //Amount to transfer should greater than zero
        require(_amount > 0, "Amount of USDC to invest should be greater than 0");

        //Get the current USDC price from function
        uint256 currentUsdcPrice = this.getCurrentUsdcPrice();

        //Calculate the total investment in USD and divide by 10**8. Because the USDC price feed comes with 8 decimals
        uint256 totalInvestmentInUsd = (_amount * currentUsdcPrice) / 100000000; 

        //Calcuale the amount of tokens to return given the current token price
        uint256 totalW3mTokenToReturn = totalInvestmentInUsd * w3mPerUSD;
        
        //Validate that the amount of W3M tokens to offer to the investor is equal or less than the amount that's left in the smart contract
        require (totalW3mTokenToReturn <= this.balanceOf(address(this)), "The amount of W3M tokens to buy must be equal or less than the tokens available");

        //Transfer USDC to this contract
        bool successReceivingUsdc  = usdcToken.transferFrom(msg.sender, address(this), _amount);
        require (successReceivingUsdc, "There was an error on receiving the USDC investment");

        //Transfer USDC to the owner wallet
        bool successSendingUsdc = usdcToken.transfer(payable(owner()), _amount);
        require (successSendingUsdc, "There was an error on sending the USDC investment to the owner");

        //Transfer W3M token to the investor wallet
        bool successSendingW3mToken = this.transfer(msg.sender, totalW3mTokenToReturn);
        require (successSendingW3mToken, "There was an error on sending back the W3M Token to the investor");

        //Emit the event of successful investment
        emit InvestFromUsdc(msg.sender, _amount, totalW3mTokenToReturn);

        return successSendingW3mToken;
    }


    /////////////VARIABLE UPDATE FUNCTIONS ONLY OWNER//////////

    //W3M per USD update
    function updateW3mPerUSD(uint256 _newW3mPerUSD) public onlyOwner {

        w3mPerUSD = _newW3mPerUSD;
        emit UpdatedW3mPerUSD(_newW3mPerUSD);
    }

    //MATIC variables update
    function updateMaticPriceFeedAddress(address _newMaticPriceFeedAddress) public onlyOwner {

        maticPriceFeedAddress = _newMaticPriceFeedAddress;
        emit UpdatedMaticPriceFeedAddress(_newMaticPriceFeedAddress);
    }

    //USDC variables update
    function updateUsdcTokenAddress(address _newUsdcTokenAddress) public onlyOwner {

        usdcTokenAddress = _newUsdcTokenAddress;
        emit UpdatedUsdcTokenAddress(_newUsdcTokenAddress);
    }

    function updateUsdcPriceFeedAddress(address _newUsdcPriceFeedAddress) public onlyOwner {

        usdcPriceFeedAddress = _newUsdcPriceFeedAddress;
        emit UpdatedUsdcPriceFeedAddress(_newUsdcPriceFeedAddress);
    }

    /////////////ORACLE PRICE FEED FUNCTIONS//////////

    function getCurrentMaticPrice() public view returns (uint256) {
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeedMatic.latestRoundData();
        
        return uint256(answer);
    }

    function getCurrentUsdcPrice() public view returns (uint256) {
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeedUsdc.latestRoundData();
        
        return uint256(answer);
    }

    ////////////////// SMART REQUIRED FUNCTIONS //////////////////

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        require(newOwner != address(this), "Ownable: new owner can not be the same contract address");
        
        _transferOwnership(newOwner);
    }

    //Receive function to be able to receive MATIC to pay for transactions gas
    receive() external payable {
    }

}