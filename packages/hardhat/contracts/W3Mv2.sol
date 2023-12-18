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

interface UsdtTokenInterface {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
}

interface WbtcTokenInterface {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
}

interface WethTokenInterface {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
}

contract W3Mv2 is ERC20Pausable, Ownable {

    ////////////////// SMART CONTRACT EVENTS //////////////////

    event TokenEmission(address sender, uint256 amount);

    event InvestFromMatic(address sender, uint256 maticAmount, uint256 w3mAmount);

    event InvestFromUsdc(address sender, uint256 usdcAmount, uint256 w3mAmount);

    event InvestFromUsdt(address sender, uint256 usdtAmount, uint256 w3mAmount);

    event InvestFromWeth(address sender, uint256 wethAmount, uint256 w3mAmount);

    event InvestFromWbtc(address sender, uint256 wbtcAmount, uint256 w3mAmount);

    event UpdatedW3mPerUSD(uint256 _newW3mPerUSD);

    event UpdatedMinimumW3mToBuy(uint256 _newMinimumW3mToBuy);

    event UpdatedMaximumW3mToBuy(uint256 _newMaximumW3mToBuy);

    event UpdatedMaticPriceFeedAddress(address _newMaticPriceFeedAddress);

    event UpdatedUsdcTokenAddress(address _newUsdcTokenAddress);
    event UpdatedUsdcPriceFeedAddress(address _newUsdcPriceFeedAddress);

    event UpdatedUsdtTokenAddress(address _newUsdtTokenAddress);
    event UpdatedUsdtPriceFeedAddress(address _newUsdtPriceFeedAddress);

    event UpdatedWbtcTokenAddress(address _newWbtcTokenAddress);
    event UpdatedWbtcPriceFeedAddress(address _newWbtcPriceFeedAddress);

    event UpdatedWethTokenAddress(address _newWethTokenAddress);
    event UpdatedWethPriceFeedAddress(address _newWethPriceFeedAddress);

    ////////////////// SMART CONTRACT VARIABLES //////////////////

    //Represent the amount of tokens to give in exchange for 1 USD
    uint256 public w3mPerUSD;

    //Represent the minimum amount of W3M to be bought by an investor
    uint256 public minimumW3mToBuy;

    //Represent the maximum amount of W3M to be bought by an investor
    uint256 public maximumW3mToBuy;

    //Mapping to track the total amount of W3M bought by investor
    mapping(address => uint256) public totalW3mBoughtByInvestor;


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

    
    /////////////USDT VARIABLES//////////

    //Address of USDT token in the blockchain
    address public usdtTokenAddress;

    //Address of USDT token price feed (Oracle) in the blockchain
    address public usdtPriceFeedAddress;

    //Aggregator that allows to ask for the price of crypto tokens
    AggregatorV3Interface internal dataFeedUsdt;

    //Declaration of USDT token interface
    UsdtTokenInterface public usdtToken;


    /////////////WBTC VARIABLES//////////

    //Address of WBTC token in the blockchain
    address public wbtcTokenAddress;

    //Address of WBTC token price feed (Oracle) in the blockchain
    address public wbtcPriceFeedAddress;

    //Aggregator that allows to ask for the price of crypto tokens
    AggregatorV3Interface internal dataFeedWbtc;

    //Declaration of WBTC token interface
    WbtcTokenInterface public wbtcToken;


    /////////////WETH VARIABLES//////////

    //Address of WETH token in the blockchain
    address public wethTokenAddress = 0x8d8FF4B47f2bCfafFaba055574bAb62B3A215819;

    //Address of WETH token price feed (Oracle) in the blockchain
    address public wethPriceFeedAddress = 0x0715A7794a1dc8e42615F059dD6e406A6594651A;

    //Aggregator that allows to ask for the price of crypto tokens
    AggregatorV3Interface internal dataFeedWeth;

    //Declaration of WETH token interface
    WethTokenInterface public wethToken;


    ////////////////// SMART CONTRACT CONSTRUCTOR /////////////////
    constructor() ERC20("W3MToken", "W3M") Ownable()
    {   
        _mint(msg.sender, 2000000000 * 10 ** decimals());

        //Setting the amount of tokens to give in exchange for 1 USD. In this case 166,66666666. Thats 8 decimals 10**8
        w3mPerUSD = 16666666666;

        //Setting the minimum W3M amount that an investor can buy. In this case equivalent to $1 USD
        minimumW3mToBuy = 166 * 10 ** decimals();

        //Setting the maximum W3M amount that an investor can buy. In this case equivalent to $100,000 USD
        maximumW3mToBuy = 16666666 * 10 ** decimals();

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


        //Address of USDT token in the blockchain
        usdtTokenAddress = 0x93678f9a27F43F0da85586FDE54a51E5F3e5eefd;

        //Address of USDT token price feed (Oracle) in the blockchain
        usdtPriceFeedAddress = 0x92C09849638959196E976289418e5973CC96d645;

        //Oracle on Mumbai network for USDT/USD https://mumbai.polygonscan.com/address/0x92C09849638959196E976289418e5973CC96d645
        dataFeedUsdt = AggregatorV3Interface(usdtPriceFeedAddress);

        //Implementation of USDT token interface
        usdtToken = UsdtTokenInterface(usdtTokenAddress);


        //Address of WBTC token in the blockchain
        wbtcTokenAddress = 0x7B3776a036E72A1eb75ff1C8ec7B35cF07b7A9EB;

        //Address of WBTC token price feed (Oracle) in the blockchain
        wbtcPriceFeedAddress = 0x007A22900a3B98143368Bd5906f8E17e9867581b;

        //Oracle on Mumbai network for WBTC/USD https://mumbai.polygonscan.com/address/0x007A22900a3B98143368Bd5906f8E17e9867581b
        dataFeedWbtc = AggregatorV3Interface(wbtcPriceFeedAddress);

        //Implementation of WBTC token interface
        wbtcToken = WbtcTokenInterface(wbtcTokenAddress);


        //Address of WETH token in the blockchain
        wethTokenAddress = 0x8d8FF4B47f2bCfafFaba055574bAb62B3A215819;

        //Address of WETH token price feed (Oracle) in the blockchain
        wethPriceFeedAddress = 0x0715A7794a1dc8e42615F059dD6e406A6594651A;

        //Oracle on Mumbai network for WETH/USD https://mumbai.polygonscan.com/address/0x0715A7794a1dc8e42615F059dD6e406A6594651A
        dataFeedWeth = AggregatorV3Interface(wethPriceFeedAddress);

        //Implementation of WETH token interface
        wethToken = WethTokenInterface(wethTokenAddress);
    }

    ////////////////// SMART CONTRACT FUNCTIONS //////////////////

    //Function to emit tokens as required
    function tokenEmission(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Amount of W3M tokens to emit must be greater than zero");
        
        //Validate the amount to emit doesn't go beyond the stablished total supply
        uint256 newTotalSupply = totalSupply() + _amount;
        require(newTotalSupply <= 10000000000 * 10 ** decimals(), "Amount of W3M tokens to emit surpases the 10,000 M tokens");

        _mint(owner(), _amount);
        emit TokenEmission(msg.sender, _amount);
    }

    //Function to calculate the amount of W3M tokens to return based on the current price of the selected currency to make the investment
    function calculateTotalW3mTokenToReturn(uint256 _amount, uint256 _currentCryptocurrencyPrice) public view returns (uint256) {
        
        //Calculate the total investment in USD and divide by 10**8. Because the cryptocurrency price feed comes with 8 decimals
        uint256 totalInvestmentInUsd = (_amount * _currentCryptocurrencyPrice) / 100000000; 

        //Calcuale the amount of tokens to return given the current token price and divide by 10**8. Because w3mPerUSD comes with 8 decimals
        uint256 totalW3mTokenToReturn = (totalInvestmentInUsd * w3mPerUSD) / 100000000;

        //Validate that the amount of W3M to buy is equal or greater than the minimum investment stablished
        require(totalW3mTokenToReturn >= minimumW3mToBuy, "The amount of W3M to buy must be equal or greater than the minimum stablished");

        //Validate that the amount of W3M tokens to offer to the investor is equal or less than the amount that's left in the smart contract
        require (totalW3mTokenToReturn <= this.balanceOf(address(this)), "The amount of W3M tokens to buy must be equal or less than the tokens available");

        return totalW3mTokenToReturn;
    }


    /////////////INVESTING FUNCTIONS//////////

    function investFromMatic() public payable returns (bool){

        //Transfer MATIC to this contract. Its automatically done with the payable tag

        //Calculate total W3M to return while validating minimum investment and if there are W3M tokens left to sell
        uint256 totalW3mTokenToReturn = this.calculateTotalW3mTokenToReturn(msg.value, this.getCurrentMaticPrice());

        //Transfer MATIC to the owner wallet
        bool successSendingMatic = payable(owner()).send(msg.value);
        require (successSendingMatic, "There was an error on sending the MATIC investment to the owner");

        //Transfer W3M token to the investor wallet
        bool successSendingW3mToken = this.transfer(msg.sender, totalW3mTokenToReturn);
        require (successSendingW3mToken, "There was an error on sending back the W3M Token to the investor");

        //Update the total amount of W3M that a investor has bought
        totalW3mBoughtByInvestor[msg.sender] += totalW3mTokenToReturn;

        //Emit the event of successful investment
        emit InvestFromMatic(msg.sender, msg.value, totalW3mTokenToReturn);

        return successSendingW3mToken;
    }


    function investFromUsdc(uint256 _amount) public returns (bool) {

        //Calculate total W3M to return while validating minimum investment and if there are W3M tokens left to sell
        uint256 totalW3mTokenToReturn = this.calculateTotalW3mTokenToReturn(_amount, this.getCurrentUsdcPrice());

        //Transfer USDC to this contract
        bool successReceivingUsdc  = usdcToken.transferFrom(msg.sender, address(this), _amount);
        require (successReceivingUsdc, "There was an error on receiving the USDC investment");

        //Transfer USDC to the owner wallet
        bool successSendingUsdc = usdcToken.transfer(payable(owner()), _amount);
        require (successSendingUsdc, "There was an error on sending the USDC investment to the owner");

        //Transfer W3M token to the investor wallet
        bool successSendingW3mToken = this.transfer(msg.sender, totalW3mTokenToReturn);
        require (successSendingW3mToken, "There was an error on sending back the W3M Token to the investor");

        //Update the total amount of W3M that a investor has bought
        totalW3mBoughtByInvestor[msg.sender] += totalW3mTokenToReturn;

        //Emit the event of successful investment
        emit InvestFromUsdc(msg.sender, _amount, totalW3mTokenToReturn);

        return successSendingW3mToken;
    }


    function investFromUsdt(uint256 _amount) public returns (bool) {

        //Calculate total W3M to return while validating minimum investment and if there are W3M tokens left to sell
        uint256 totalW3mTokenToReturn = this.calculateTotalW3mTokenToReturn(_amount, this.getCurrentUsdtPrice());

        //Transfer USDT to this contract
        bool successReceivingUsdt  = usdtToken.transferFrom(msg.sender, address(this), _amount);
        require (successReceivingUsdt, "There was an error on receiving the USDT investment");

        //Transfer USDT to the owner wallet
        bool successSendingUsdt = usdtToken.transfer(payable(owner()), _amount);
        require (successSendingUsdt, "There was an error on sending the USDT investment to the owner");
        
        //Transfer W3M token to the investor wallet
        bool successSendingW3mToken = this.transfer(msg.sender, totalW3mTokenToReturn);
        require (successSendingW3mToken, "There was an error on sending back the W3M Token to the investor");

        //Update the total amount of W3M that a investor has bought
        totalW3mBoughtByInvestor[msg.sender] += totalW3mTokenToReturn;

        //Emit the event of successful investment
        emit InvestFromUsdt(msg.sender, _amount, totalW3mTokenToReturn);

        return successSendingW3mToken;
    }


    function investFromWbtc(uint256 _amount) public returns (bool) {

        //Calculate total W3M to return while validating minimum investment and if there are W3M tokens left to sell
        uint256 totalW3mTokenToReturn = this.calculateTotalW3mTokenToReturn(_amount, this.getCurrentWbtcPrice());

        //Transfer WBTC to this contract
        bool successReceivingWbtc  = wbtcToken.transferFrom(msg.sender, address(this), _amount);
        require (successReceivingWbtc, "There was an error on receiving the WBTC investment");

        //Transfer WBTC to the owner wallet
        bool successSendingWbtc = wbtcToken.transfer(payable(owner()), _amount);
        require (successSendingWbtc, "There was an error on sending the WBTC investment to the owner");
        
        //Transfer W3M token to the investor wallet
        bool successSendingW3mToken = this.transfer(msg.sender, totalW3mTokenToReturn);
        require (successSendingW3mToken, "There was an error on sending back the W3M Token to the investor");

        //Update the total amount of W3M that a investor has bought
        totalW3mBoughtByInvestor[msg.sender] += totalW3mTokenToReturn;

        //Emit the event of successful investment
        emit InvestFromWbtc(msg.sender, _amount, totalW3mTokenToReturn);

        return successSendingW3mToken;
    }


    function investFromWeth(uint256 _amount) public returns (bool) {

        //Calculate total W3M to return while validating minimum investment and if there are W3M tokens left to sell
        uint256 totalW3mTokenToReturn = this.calculateTotalW3mTokenToReturn(_amount, this.getCurrentWethPrice());

        //Transfer WETH to this contract
        bool successReceivingWeth  = wethToken.transferFrom(msg.sender, address(this), _amount);
        require (successReceivingWeth, "There was an error on receiving the WETH investment");

        //Transfer WETH to the owner wallet
        bool successSendingWeth = wethToken.transfer(payable(owner()), _amount);
        require (successSendingWeth, "There was an error on sending the WETH investment to the owner");

        //Transfer W3M token to the investor wallet
        bool successSendingW3mToken = this.transfer(msg.sender, totalW3mTokenToReturn);
        require (successSendingW3mToken, "There was an error on sending back the W3M Token to the investor");

        //Update the total amount of W3M that a investor has bought
        totalW3mBoughtByInvestor[msg.sender] += totalW3mTokenToReturn;

        //Emit the event of successful investment
        emit InvestFromWeth(msg.sender, _amount, totalW3mTokenToReturn);

        return successSendingW3mToken;
    }

    /////////////VARIABLE UPDATE FUNCTIONS ONLY OWNER//////////

    //W3M per USD update
    function updateW3mPerUSD(uint256 _newW3mPerUSD) public onlyOwner {

        require(_newW3mPerUSD > 0, "New W3M per USD value, must be greater than zero");
        w3mPerUSD = _newW3mPerUSD;
        emit UpdatedW3mPerUSD(_newW3mPerUSD);
    }

    //Minimum W3M to buy update
    function updateMinimumW3mToBuy(uint256 _newMinimumW3mToBuy) public onlyOwner {

        require(_newMinimumW3mToBuy > 0, "New minimun amount of W3M to buy, must be greater than zero");
        minimumW3mToBuy = _newMinimumW3mToBuy;
        emit UpdatedMinimumW3mToBuy(_newMinimumW3mToBuy);
    }

    //Maximum W3M to buy update
    function updateMaximumW3mToBuy(uint256 _newMaximumW3mToBuy) public onlyOwner {

        require(_newMaximumW3mToBuy > 0, "New maximum amount of W3M to buy, must be greater than zero");
        maximumW3mToBuy = _newMaximumW3mToBuy;
        emit UpdatedMaximumW3mToBuy(_newMaximumW3mToBuy);
    }


    //MATIC variables update
    function updateMaticPriceFeedAddress(address _newMaticPriceFeedAddress) public onlyOwner {

        require(_newMaticPriceFeedAddress != address(0), "The price data feed address can not be the zero address");
        maticPriceFeedAddress = _newMaticPriceFeedAddress;
        emit UpdatedMaticPriceFeedAddress(_newMaticPriceFeedAddress);
    }

    //USDC variables update
    function updateUsdcTokenAddress(address _newUsdcTokenAddress) public onlyOwner {

        require(_newUsdcTokenAddress != address(0), "The token address can not be the zero address");
        usdcTokenAddress = _newUsdcTokenAddress;
        emit UpdatedUsdcTokenAddress(_newUsdcTokenAddress);
    }

    function updateUsdcPriceFeedAddress(address _newUsdcPriceFeedAddress) public onlyOwner {

        require(_newUsdcPriceFeedAddress != address(0), "The price data feed address can not be the zero address");
        usdcPriceFeedAddress = _newUsdcPriceFeedAddress;
        emit UpdatedUsdcPriceFeedAddress(_newUsdcPriceFeedAddress);
    }

    //USDT variables update
    function updateUsdtTokenAddress(address _newUsdtTokenAddress) public onlyOwner {

        require(_newUsdtTokenAddress != address(0), "The token address can not be the zero address");
        usdtTokenAddress = _newUsdtTokenAddress;
        emit UpdatedUsdtTokenAddress(_newUsdtTokenAddress);
    }

    function updateUsdtPriceFeedAddress(address _newUsdtPriceFeedAddress) public onlyOwner {

        require(_newUsdtPriceFeedAddress != address(0), "The price data feed address can not be the zero address");
        usdtPriceFeedAddress = _newUsdtPriceFeedAddress;
        emit UpdatedUsdtPriceFeedAddress(_newUsdtPriceFeedAddress);
    }

    //WBTC variables update
    function updateWbtcTokenAddress(address _newWbtcTokenAddress) public onlyOwner {

        require(_newWbtcTokenAddress != address(0), "The token address can not be the zero address");
        wbtcTokenAddress = _newWbtcTokenAddress;
        emit UpdatedWbtcTokenAddress(_newWbtcTokenAddress);
    }

    function updateWbtcPriceFeedAddress(address _newWbtcPriceFeedAddress) public onlyOwner {

        require(_newWbtcPriceFeedAddress != address(0), "The price data feed address can not be the zero address");
        wbtcPriceFeedAddress = _newWbtcPriceFeedAddress;
        emit UpdatedWbtcPriceFeedAddress(_newWbtcPriceFeedAddress);
    }

    //WETH variables update
    function updateWethTokenAddress(address _newWethTokenAddress) public onlyOwner {

        require(_newWethTokenAddress != address(0), "The token address can not be the zero address");
        wethTokenAddress = _newWethTokenAddress;
        emit UpdatedWethTokenAddress(_newWethTokenAddress);
    }

    function updateWethPriceFeedAddress(address _newWethPriceFeedAddress) public onlyOwner {

        require(_newWethPriceFeedAddress != address(0), "The price data feed address can not be the zero address");
        wethPriceFeedAddress = _newWethPriceFeedAddress;
        emit UpdatedWethPriceFeedAddress(_newWethPriceFeedAddress);
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

    function getCurrentUsdtPrice() public view returns (uint256) {
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeedUsdt.latestRoundData();
        
        return uint256(answer);
    }

    function getCurrentWbtcPrice() public view returns (uint256) {
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeedWbtc.latestRoundData();
        
        return uint256(answer);
    }

    function getCurrentWethPrice() public view returns (uint256) {
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeedWeth.latestRoundData();
        
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
