/*
  The following test cases were built around accounting-related consistency and specific user flows
  As secondary goal the tests are made to validate gas efficiency.

  Scope: The scope of the following test cases is the W3M smart contract functions
  Approach: The tests to be performed will be Unit tests (for trivial functions) and Integration tests (for complex functions)
  Resources: The tool to use for the following tests is the Hardhat specialized test runner based on ethers.js
*/
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Test case #1. Deployment of W3M smart contract", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2};
  }

    it("1.1. Should have the right smart contract name", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      expect(await w3m.name()).to.equal("W3MToken");
    });

    it("1.2. Should have the right smart contract symbol", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      expect(await w3m.symbol()).to.equal("W3M");
    });

    it("1.3. Should have the right total supply", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      expect(await w3m.totalSupply()).to.equal(ethers.utils.parseUnits("500000000", 18));
    });

    it("1.4. Should have the right W3M price", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      expect(await w3m.w3mPrice()).to.equal(ethers.utils.parseUnits("0.006", 8));
    });

    it("1.5. Should have the right minimum investment allowed in USD", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      expect(await w3m.minimumInvestmentAllowedInUSD()).to.equal(ethers.utils.parseUnits("1", 18));
    });

    it("1.6. Should have the right maximum investment allowed in USD", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      expect(await w3m.maximumInvestmentAllowedInUSD()).to.equal(ethers.utils.parseUnits("10000", 18));
    });

    it("1.7. Should have the right white lister address", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      expect(await w3m.whiteListerAddress()).to.equal('0xB803cB7d42291DC78C5f4Db23B7363c04c6274A4');
    });

    it("1.8. Smart contract should have all the total supply in it's balance", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      var totalSupplyHex = await w3m.totalSupply();
      await w3m.transfer( w3m.address, totalSupplyHex.toString());  //Line to transfer the W3M tokens from the deployer to the smart contract
      //The smart contract W3M balance must be of 500 M W3M
      expect(await w3m.balanceOf(w3m.address)).to.equal(ethers.utils.parseUnits("500000000", 18));
    });

    it("1.9. Smart contract owner should be the new admin address", async function () {
      const { w3m, deployer, owner } = await loadFixture(deployContractAndSetVariables);
      console.log("          Deployer address: ", deployer.address);
      await w3m.transferOwnership(owner.address);
      console.log("          Owner address: ", owner.address);
      console.log("          New owner address: ", await w3m.owner());
      expect(await w3m.owner()).to.equal(owner.address);
    });
});


describe("Test case #2. Calculate total W3M to return to investor", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2] = await ethers.getSigners();
    ethers.get
    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  
    console.log("          Smart contract balance is: ", (await w3m.balanceOf(w3m.address)).toString());

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2};
  }

    it("2.1. Should revert transaction because of execution with zero in first paratemer", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.calculateTotalW3mTokenToReturn(0, ethers.utils.parseUnits("30000", 8)))
      .to.be.revertedWith('The amount to invest must be greater than the minimum established');
    });

    it("2.2. Should revert transaction because of execution with zero in second parameter", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.calculateTotalW3mTokenToReturn(ethers.utils.parseUnits("10", 18), 0))
      .to.be.revertedWith('The amount to invest must be greater than the minimum established');
    });

    it("2.3. Should revert transaction because of execution with zero in both parameters", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.calculateTotalW3mTokenToReturn(0, 0))
      .to.be.revertedWith('The amount to invest must be greater than the minimum established');
    });

    it("2.4. Should revert transaction because it asks for an amount just below the minimum established", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      //Trying to invest 0.999 USD at a price of 1 USD each one
      await expect( w3m.calculateTotalW3mTokenToReturn(ethers.utils.parseUnits("0.999", 18), ethers.utils.parseUnits("1", 8)))
      .to.be.revertedWith('The amount to invest must be greater than the minimum established');
    });

    it("2.5. Should revert transaction because it asks for an amount just over the maximum current supply", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      //Trying to invest 100 BTC at a price of 30121 USD each BTC
      await expect( w3m.calculateTotalW3mTokenToReturn(ethers.utils.parseUnits("100", 18), ethers.utils.parseUnits("30001", 8)))
      .to.be.revertedWith('The investment made returns an amount of W3M greater than the available');
    });

    it("2.6. Should properly execute the function because it asks for an amount just in the minimum to invest", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);
      //Trying to invest 1 USD at a price of 1 USD each one
      var [totalInvestmentInUsd, totalW3mTokenToReturn] = await w3m.calculateTotalW3mTokenToReturn(ethers.utils.parseUnits("1", 18), ethers.utils.parseUnits("1", 8));
      
      expect(totalW3mTokenToReturn).to.equal(ethers.utils.parseUnits("1666666666666", 8));
    });

    it("2.7. Should properly execute the function because it asks for an amount just in the maximum available to invest", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);

      //Trying to invest 100 BTC at a price of 30000 USD each one
      var [totalInvestmentInUsd, totalW3mTokenToReturn] = await w3m.calculateTotalW3mTokenToReturn(ethers.utils.parseUnits("100", 18), ethers.utils.parseUnits("30000", 8));
      
      expect(totalW3mTokenToReturn).to.equal(ethers.utils.parseUnits("500000000", 18));
    });

    it("2.8. Should properly execute the function because it asks for an amount just in the middle of the total available to invest", async function () {
      const { w3m } = await loadFixture(deployContractAndSetVariables);

      //Trying to invest 50 BTC at a price of 30000 USD each one
      var [totalInvestmentInUsd, totalW3mTokenToReturn] = await w3m.calculateTotalW3mTokenToReturn(ethers.utils.parseUnits("50", 18), ethers.utils.parseUnits("30000", 8));
      
      expect(totalW3mTokenToReturn).to.equal(ethers.utils.parseUnits("250000000", 18));
    });
});


describe("Test case #3. Add investor address to white list", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

    it("3.1. Should revert transaction because of execution with an address without permission", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(addr1).addToWhiteList(addr2.address))
      .to.be.revertedWith('Function reserved only for the white lister address or the owner');
    });

    it("3.2. Should revert transaction because of execution with zero address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(owner).addToWhiteList(ethers.constants.AddressZero))
      .to.be.revertedWith('Investor address to add to the white list can not be the zero address');
    });
 
    it("3.3. Should properly execute the function because it's executed with the owner address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Add investor address to the white list using the owner address
      await w3m.connect(owner).addToWhiteList(addr2.address);

      expect(await w3m.investorsWhiteList(addr2.address)).to.equal(true);
    });

    it("3.4. Should properly execute the function because it's executed with the white lister address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      expect(await w3m.investorsWhiteList(addr2.address)).to.equal(true);
    });

    it("3.5. Should revert transaction because of execution with address already added to the white list as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      //Add investor address again to the white list using the white lister address
      await expect( w3m.connect(addr1).addToWhiteList(addr2.address))
      .to.be.revertedWith('That investor address has already been added to the white list');
    });

});


describe("Test case #4. Remove investor address from the white list", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

    it("4.1. Should revert transaction because of execution with an address without permission", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(addr1).removeFromWhiteList(addr2.address))
      .to.be.revertedWith('Function reserved only for the white lister address or the owner');
    });

    it("4.2. Should revert transaction because of execution with zero address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(owner).removeFromWhiteList(ethers.constants.AddressZero))
      .to.be.revertedWith('Investor address to remove from the white list can not be the zero address');
    });
 
    it("4.3. Should properly execute the function because it's executed with the owner address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Add investor address to the white list using the owner address
      await w3m.connect(owner).addToWhiteList(addr2.address);

      //Remove investor address to the white list using the owner address
      await w3m.connect(owner).removeFromWhiteList(addr2.address);

      expect(await w3m.investorsWhiteList(addr2.address)).to.equal(false);
    });

    it("4.4. Should properly execute the function because it's executed with the white lister address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      //Remove investor address to the white list using the white lister address
      await w3m.connect(addr1).removeFromWhiteList(addr2.address);

      expect(await w3m.investorsWhiteList(addr2.address)).to.equal(false);
    });

    it("4.5. Should revert transaction because of execution with address already removed from the white list as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      //Remove investor address to the white list using the white lister address
      await w3m.connect(addr1).removeFromWhiteList(addr2.address);

      //Remove investor address again to the white list using the white lister address
      await expect( w3m.connect(addr1).removeFromWhiteList(addr2.address))
      .to.be.revertedWith('That investor address is not registered on the white list');
    });

});


describe("Test case #5. Validate if investor address is on the white list", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

    it("5.1. Should properly execute because this test case belongs to a modifier tested on the investFrom* functions", async function () {

      await expect(true).to.equal(true);
    });

});


describe("Test case #6. Add investor address to qualified investor list", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

    it("6.1. Should revert transaction because of execution with an address without permission", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(addr1).addToQualifiedInvestorList(addr2.address))
      .to.be.revertedWith('Function reserved only for the white lister address or the owner');
    });

    it("6.2. Should revert transaction because of execution with zero address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      await expect( w3m.connect(addr1).addToQualifiedInvestorList(ethers.constants.AddressZero))
      .to.be.revertedWith('Investor address to add to the qualified investor list can not be the zero address');
    });

    it("6.3. Should revert the function becase the address has not been added yet to the investors white list", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Add investor address to the qualified investor list using the owner address
      await expect( w3m.connect(owner).addToQualifiedInvestorList(addr2.address))
      .to.be.revertedWith('Investor address must be first added to the investor white list');
    });

    it("6.4. Should properly execute the function because it's executed with the owner address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Add investor address to the white list using the white lister address
      await w3m.connect(owner).addToWhiteList(addr2.address);

      //Add investor address to the qualified investor list using the owner address
      await w3m.connect(owner).addToQualifiedInvestorList(addr2.address);

      expect(await w3m.qualifiedInvestorList(addr2.address)).to.equal(true);
    });

    it("6.5. Should properly execute the function because it's executed with the white lister address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      //Add investor address to the qualified investor list using the white lister address
      await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

      expect(await w3m.qualifiedInvestorList(addr2.address)).to.equal(true);
    });

    it("6.6. Should revert transaction because of execution with address already added to the white list as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      //Add investor address to the qualified investor list using the white lister address
      await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

      //Add investor address again to the white list using the white lister address
      await expect( w3m.connect(addr1).addToQualifiedInvestorList(addr2.address))
      .to.be.revertedWith('That investor address has already been added to the qualified investor list');
    });
});


describe("Test case #7. Remove investor address from qualified investor list", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

    it("7.1. Should revert transaction because of execution with an address without permission", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(addr1).removeFromQualifiedInvestorList(addr2.address))
      .to.be.revertedWith('Function reserved only for the white lister address or the owner');
    });

    it("7.2. Should revert transaction because of execution with zero address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(owner).removeFromQualifiedInvestorList(ethers.constants.AddressZero))
      .to.be.revertedWith('Investor address to remove from the qualified investor list can not be the zero address');
    });
 
    it("7.3. Should properly execute the function because it's executed with the owner address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Add investor address to the white list using the white lister address
      await w3m.connect(owner).addToWhiteList(addr2.address);

      //Add investor address to the qualified investor list using the owner address
      await w3m.connect(owner).addToQualifiedInvestorList(addr2.address);

      //Remove investor address from the qualified investor list using the owner address
      await w3m.connect(owner).removeFromQualifiedInvestorList(addr2.address);

      expect(await w3m.qualifiedInvestorList(addr2.address)).to.equal(false);
    });

    it("7.4. Should properly execute the function because it's executed with the white lister address and a valid address as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      //Add investor address to the qualified investor list using the white lister address
      await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

      //Remove investor address from the qualified investor list using the white lister address
      await w3m.connect(addr1).removeFromQualifiedInvestorList(addr2.address);

      expect(await w3m.qualifiedInvestorList(addr2.address)).to.equal(false);
    });

    it("7.5. Should revert transaction because of execution because address already removed from the qualified investor list as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Define the new white lister address
      await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

      //Add investor address to the white list using the white lister address
      await w3m.connect(addr1).addToWhiteList(addr2.address);

      //Add investor address to the qualified investor list using the white lister address
      await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

      //Remove investor address to the white list using the white lister address
      await w3m.connect(addr1).removeFromQualifiedInvestorList(addr2.address);

      //Remove investor address again to the qualified investor list using the white lister address
      await expect( w3m.connect(addr1).removeFromQualifiedInvestorList(addr2.address))
      .to.be.revertedWith('That investor address is not registered on the qualified investor list');
    });
});


describe("Test case #8. W3M token issuance", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

    it("8.1. Should revert transaction because of execution with an address without permission", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      await expect( w3m.connect(addr1).tokenIssuance(ethers.utils.parseUnits("500000000", 18)))
      .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("8.2. Should revert transaction because of execution with zero value as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
  
      await expect( w3m.connect(owner).tokenIssuance(0))
      .to.be.revertedWith('Amount of W3M tokens to issue must be at least 1 token');
    });

    it("8.3. Should revert transaction because of execution with an overflow controlled by the 10,000 M tokens check", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
  
      await expect( w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("100000000000000000000000000000000", 18)))
      .to.be.revertedWith('Amount of W3M tokens to issue at a time must be maximum 1000 M');
    });

    it("8.4. Should revert the function because it surpases the cap limit of maximum 1000 M at a time", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
      
      //Issuance of  1000 000 001 surpases the cap limit of maximum 1000M at a time
      await expect( w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000001", 18)))
      .to.be.revertedWith('Amount of W3M tokens to issue at a time must be maximum 1000 M');
    });

    it("8.5. Should revert the function because it surpases the 10,000 M tokens", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
      
      //Issue 1000 M tokens, now we have 1500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 2500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 3500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 4500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 5500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 6500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 7500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 8500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issue 1000 M tokens, now we have 9500 M tokens
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18));

      //Issuance of 1000M tokens makes the total supply, creates 10500 M tokes which surpasses the maximum amount of tokens to create
      await expect( w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000000000", 18)))
      .to.be.revertedWith('Amount of W3M tokens to issue surpases the 10,000 M tokens');
    });
 
    it("8.6. Should properly execute the function because it's executed with the owner address and a valid amount as parameter", async function () {
      const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

      //Issuance of 500 M tokens makes the total supply reach the 1,000 M W3M
      await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("500000000", 18));

      expect(await w3m.totalSupply()).to.equal(ethers.utils.parseUnits("1000000000", 18));
    });



});

describe("Test case #9. Get total supply", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("9.1. Should properly execute the function and get the initial total supply", async function () {
    const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.totalSupply()).to.equal(ethers.utils.parseUnits("500000000", 18));
  });

  it("9.2. Should properly execute the function and get the new total supply", async function () {
    const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //Issuance of 500 M tokens makes the total supply reach the 1,000 M W3M
    await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("500000000", 18));

    expect(await w3m.totalSupply()).to.equal(ethers.utils.parseUnits("1000000000", 18));
  });

});


describe("Test case #10. Get address balance", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("10.1. Should properly execute the function and get a zero balance of an address without tokens", async function () {
    const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("0", 18));
  });

  it("10.2. Should properly execute the function and get the balance of an address with tokens", async function () {
    const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.balanceOf(w3m.address)).to.equal(ethers.utils.parseUnits("500000000", 18));
  });

  it("10.3. Should properly execute the function and get the new balance of the owner address after token issuance", async function () {
    const { w3m, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("500000000", 18));

    expect(await w3m.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("500000000", 18));
  });

});

describe("Test case #11. Transfer W3M tokens from an address to another", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("11.1. Should revert transaction because of execution with zero balance", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).transfer(addr1.address, ethers.utils.parseUnits("100", 18)))
    .to.be.revertedWith('ERC20: transfer amount exceeds balance');
  });

  it("11.2. Should properly execute the function because the balance of the sender is positive", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(deployer).transfer(owner.address, ethers.utils.parseUnits("1000", 18));

    expect(await w3m.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("1000", 18));
  });
});



describe("Test case #12. Get value of allowance", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("12.1. Should properly execute the function and get a zero balance from an address with no allowance", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.allowance(deployer.address, owner.address)).to.equal(ethers.utils.parseUnits("0", 18));
  });

  it("12.2. Should properly execute the function and get the allowance of the address", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.approve(owner.address, ethers.utils.parseUnits("1000", 18));

    expect(await w3m.allowance(deployer.address, owner.address)).to.equal(ethers.utils.parseUnits("1000", 18));
  });

});


describe("Test case #13. Approve W3M tokens", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("13.1. Should properly execute the function and approve the amount, approve function does not require balance", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.approve(owner.address, ethers.utils.parseUnits("1000", 18));

    expect(await w3m.allowance(deployer.address, owner.address)).to.equal(ethers.utils.parseUnits("1000", 18));
  });

});


describe("Test case #14. Transfer from W3M tokens", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("14.1. Should revert transaction because of execution with no approved allowance", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).transferFrom(deployer.address, addr1.address, ethers.utils.parseUnits("100", 18)))
    .to.be.revertedWith('ERC20: insufficient allowance');
  });

  it("14.2. Should revert transaction because of execution with an amount greater than the allowance", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.approve(owner.address, ethers.utils.parseUnits("1000", 18));

    await expect( w3m.connect(owner).transferFrom(deployer.address, addr1.address, ethers.utils.parseUnits("1001", 18)))
    .to.be.revertedWith('ERC20: insufficient allowance');
  });

  it("14.3. Should properly execute the function because it has a valid address and allowed amount", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.approve(owner.address, ethers.utils.parseUnits("1000", 18));

    await w3m.connect(owner).transferFrom(deployer.address, addr1.address, ethers.utils.parseUnits("1000", 18))

    expect(await w3m.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("1000", 18));
  });

});


describe("Test case #15. Invest from MATIC", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    
    //Deploy the MATIC price data feed mock
    const MaticPriceDataFeedMock = await ethers.getContractFactory('MaticPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const maticPriceDataFeedMock = await MaticPriceDataFeedMock.deploy();

    //Update the address of the MATIC price data feed mock
    await w3m.connect(owner).updateMaticPriceFeedAddress(maticPriceDataFeedMock.address);

    
    //Update the white lister address
    await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("15.1. Should revert transaction because of execution with address that's not on the white list", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
    
    await expect( w3m.connect(addr2).investFromMatic({value: ethers.utils.parseEther("100")}))
    .to.be.revertedWith('Investor address has not been added to the white list');
  });


  it("15.2. Should revert transaction because of execution with no MATIC", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
    
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await expect( w3m.connect(addr2).investFromMatic({value: ethers.utils.parseEther("0")}))
    .to.be.revertedWith('The amount to invest must be greater than the minimum established');
  });


  it("15.3. Should revert transaction because it doesn't meet the minimum investment requirement", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
    
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await expect( w3m.connect(addr2).investFromMatic({value: ethers.utils.parseEther("1")}))
    .to.be.revertedWith('The amount to invest must be greater than the minimum established');
  });


  it("15.4. Should revert transaction because the amount exceeds the maximum non qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await w3m.connect(addr2).investFromMatic({value: ethers.utils.parseEther("9000")});

    await addr3.sendTransaction({
      to: addr2.address,
      value: ethers.utils.parseEther("3000"),
    });

    //2064 W3M tokens at a price of 0.90387255 make the investment go just above the 10K limit
    await expect( w3m.connect(addr2).investFromMatic({value: ethers.utils.parseEther("2064")}))
    .to.be.revertedWith('To buy that amount of W3M its required to be a qualified investor');
  });

  it("15.5. Should properly execute the function because now the investor is registered as qualified investor", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await w3m.connect(addr2).investFromMatic({value: ethers.utils.parseEther("9000")});

    await addr3.sendTransaction({
      to: addr2.address,
      value: ethers.utils.parseEther("5000"),
    });

    await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromMatic({value: ethers.utils.parseEther("3000")});

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });


  it("15.6. Should properly execute the function because it sends exactly the amount minus the gas to pay", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Estimate the gas that's required to execute the transactions
    const gasEstimation = await w3m.connect(addr2).estimateGas.investFromMatic({value: ethers.utils.parseEther("10000")});
    console.log("gasEstimation", gasEstimation.toString());
    //Obtain the approximate of the gas price
    const gasPrice = await ethers.provider.getGasPrice();
    console.log("gasPrice", gasPrice.toString());

    //Obtain the gas estimation by multiplying the gas estimation by the gas price and turn it into Gwei
    const gasFeeInWei = gasPrice.mul(gasEstimation).mul(1000);
    console.log("gasFeeInWei", gasFeeInWei.toString());

    //Calculate the actual value to invest, substracting the gas fee from the total that the account has
    const valueToInvest = ethers.utils.parseEther("10000").sub(gasFeeInWei);
    console.log("valueToInvest", valueToInvest.toString());

    //Calculate the total W3M to return in the MATIC investment
    var [totalInvestmentInUsd, totalW3mTokenToReturn] = await w3m.calculateTotalW3mTokenToReturn(valueToInvest, await w3m.getCurrentMaticPrice());

    //Send the investment in MATIC to the smart contract to recieve W3M tokens in return
    await w3m.connect(addr2).investFromMatic({value: valueToInvest});

    expect(await w3m.balanceOf(addr2.address)).to.equal(totalW3mTokenToReturn);
  });
});


describe("Test case #16. Invest from USDC", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    
    //Deploy the USDC price data feed mock
    const UsdcPriceDataFeedMock = await ethers.getContractFactory('UsdcPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const usdcPriceDataFeedMock = await UsdcPriceDataFeedMock.deploy();

    //Update the address of the USDC price data feed mock
    await w3m.connect(owner).updateUsdcPriceFeedAddress(usdcPriceDataFeedMock.address);


    //Deploy the USDC token mock
    const UsdcToken = await ethers.getContractFactory('UsdcToken');

    //Deploy smart contract with established parameters
    const usdcToken = await UsdcToken.deploy();

    //Send 100K USDC to the investor address
    await usdcToken.transfer(
      addr2.address, ethers.utils.parseUnits("100000", 18)
    );

    
    //Update the address of the USDC token mock
    await w3m.connect(owner).updateUsdcTokenAddress(usdcToken.address);

    //Update the white lister address
    await w3m.connect(owner).updateWhiteListerAddress(addr1.address);
    
    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, usdcToken};
  }

  it("16.1. Should revert transaction because of execution with address that's not on the white list", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdcToken } = await loadFixture(deployContractAndSetVariables);
    
    await expect( w3m.connect(addr2).investFromUsdc(ethers.utils.parseEther("1000")))
    .to.be.revertedWith('Investor address has not been added to the white list');
  });

  it("16.2. Should revert transaction because it has not been approved in the USDC smart contract", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await expect( w3m.connect(addr2).investFromUsdc(ethers.utils.parseEther("1000")))
    .to.be.revertedWith('ERC20: insufficient allowance');
  });

  it("16.3. Should revert transaction because it doesn't meet the minimum investment requirement", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the USDC smart contract
    await usdcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("0.5"));

    await expect( w3m.connect(addr2).investFromUsdc(ethers.utils.parseEther("0.5")))
    .to.be.revertedWith('The amount to invest must be greater than the minimum established');
  });

  it("16.4. Should revert transaction because the amount exceeds the maximum non qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the USDC smart contract
    await usdcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("11000"));

    await expect( w3m.connect(addr2).investFromUsdc(ethers.utils.parseEther("11000")))
    .to.be.revertedWith('To buy that amount of W3M its required to be a qualified investor');
  });

  it("16.5. Should properly execute the function because it sends an amount below the qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the USDC smart contract
    await usdcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("9000"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromUsdc(ethers.utils.parseEther("9000"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

  it("16.6. Should properly execute the function because now the investor is registered as qualified investor", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Add investor address to the qualified investor list
    await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

    //Approve the spending of the crypto in the USDC smart contract
    await usdcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("20000"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromUsdc(ethers.utils.parseEther("20000"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

});


describe("Test case #17. Invest from USDT", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    
    //Deploy the USDT price data feed mock
    const UsdtPriceDataFeedMock = await ethers.getContractFactory('UsdtPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const usdtPriceDataFeedMock = await UsdtPriceDataFeedMock.deploy();

    //Update the address of the USDT price data feed mock
    await w3m.connect(owner).updateUsdtPriceFeedAddress(usdtPriceDataFeedMock.address);


    //Deploy the USDT token mock
    const UsdtToken = await ethers.getContractFactory('UsdtToken');

    //Deploy smart contract with established parameters
    const usdtToken = await UsdtToken.deploy();

    //Send 100K USDT to the investor address
    await usdtToken.transfer(
      addr2.address, ethers.utils.parseUnits("100000", 18)
    );

    //Update the address of the USDT token mock
    await w3m.connect(owner).updateUsdtTokenAddress(usdtToken.address);


    //Update the white lister address
    await w3m.connect(owner).updateWhiteListerAddress(addr1.address);

    
    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, usdtToken};
  }

  it("17.1. Should revert transaction because of execution with address that's not on the white list", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdtToken } = await loadFixture(deployContractAndSetVariables);
    
    await expect( w3m.connect(addr2).investFromUsdt(ethers.utils.parseEther("1000")))
    .to.be.revertedWith('Investor address has not been added to the white list');
  });

  it("17.2. Should revert transaction because it has not been approved in the USDT smart contract", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdtToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await expect( w3m.connect(addr2).investFromUsdt(ethers.utils.parseEther("1000")))
    .to.be.revertedWith('ERC20: insufficient allowance');
  });

  it("17.3. Should revert transaction because it doesn't meet the minimum investment requirement", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdtToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the USDT smart contract
    await usdtToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("0.5"));

    await expect( w3m.connect(addr2).investFromUsdt(ethers.utils.parseEther("0.5")))
    .to.be.revertedWith('The amount to invest must be greater than the minimum established');
  });

  it("17.4. Should revert transaction because the amount exceeds the maximum non qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdtToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the USDT smart contract
    await usdtToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("11000"));

    await expect( w3m.connect(addr2).investFromUsdt(ethers.utils.parseEther("11000")))
    .to.be.revertedWith('To buy that amount of W3M its required to be a qualified investor');
  });

  it("17.5. Should properly execute the function because it sends an amount below the qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdtToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the USDT smart contract
    await usdtToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("9000"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromUsdt(ethers.utils.parseEther("9000"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

  it("17.6. Should properly execute the function because now the investor is registered as qualified investor", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdtToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Add investor address to the qualified investor list
    await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

    //Approve the spending of the crypto in the USDT smart contract
    await usdtToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("20000"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromUsdt(ethers.utils.parseEther("20000"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

});

describe("Test case #18. Invest from WETH", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    
    //Deploy the WETH price data feed mock
    const WethPriceDataFeedMock = await ethers.getContractFactory('WethPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const wethPriceDataFeedMock = await WethPriceDataFeedMock.deploy();

    //Update the address of the WETH price data feed mock
    await w3m.connect(owner).updateWethPriceFeedAddress(wethPriceDataFeedMock.address);


    //Deploy the WETH token mock
    const WethToken = await ethers.getContractFactory('WethToken');

    //Deploy smart contract with established parameters
    const wethToken = await WethToken.deploy();

    //Send 100K WETH to the investor address
    await wethToken.transfer(
      addr2.address, ethers.utils.parseUnits("100000", 18)
    );

    //Update the address of the WETH token mock
    await w3m.connect(owner).updateWethTokenAddress(wethToken.address);


    //Update the white lister address
    await w3m.connect(owner).updateWhiteListerAddress(addr1.address);


    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, wethToken};
  }

  it("18.1. Should revert transaction because of execution with address that's not on the white list", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wethToken } = await loadFixture(deployContractAndSetVariables);
    
    await expect( w3m.connect(addr2).investFromWeth(ethers.utils.parseEther("1")))
    .to.be.revertedWith('Investor address has not been added to the white list');
  });

  it("18.2. Should revert transaction because it has not been approved in the WETH smart contract", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wethToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await expect( w3m.connect(addr2).investFromWeth(ethers.utils.parseEther("1")))
    .to.be.revertedWith('ERC20: insufficient allowance');
  });

  it("18.3. Should revert transaction because it doesn't meet the minimum investment requirement", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wethToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the weth smart contract
    await wethToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("0.00001"));

    await expect( w3m.connect(addr2).investFromWeth(ethers.utils.parseEther("0.00001")))
    .to.be.revertedWith('The amount to invest must be greater than the minimum established');
  });

  it("18.4. Should revert transaction because the amount exceeds the maximum non qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wethToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the WETH smart contract
    await wethToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("10"));

    await expect( w3m.connect(addr2).investFromWeth(ethers.utils.parseEther("10")))
    .to.be.revertedWith('To buy that amount of W3M its required to be a qualified investor');
  });

  it("18.5. Should properly execute the function because it sends an amount below the qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wethToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the WETH smart contract
    await wethToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("4"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromWeth(ethers.utils.parseEther("4"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

  it("18.6. Should properly execute the function because now the investor is registered as qualified investor", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wethToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Add investor address to the qualified investor list
    await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

    //Approve the spending of the crypto in the WETH smart contract
    await wethToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("20"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromWeth(ethers.utils.parseEther("20"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

});

describe("Test case #19. Invest from WBTC", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    
    //Deploy the WBTC price data feed mock
    const WbtcPriceDataFeedMock = await ethers.getContractFactory('WbtcPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const wbtcPriceDataFeedMock = await WbtcPriceDataFeedMock.deploy();

    //Update the address of the WBTC price data feed mock
    await w3m.connect(owner).updateWbtcPriceFeedAddress(wbtcPriceDataFeedMock.address);


    //Deploy the WBTC token mock
    const WbtcToken = await ethers.getContractFactory('WbtcToken');

    //Deploy smart contract with established parameters
    const wbtcToken = await WbtcToken.deploy();

    //Send 100K WBTC to the investor address
    await wbtcToken.transfer(
      addr2.address, ethers.utils.parseUnits("100000", 18)
    );

    //Update the address of the WBTC token mock
    await w3m.connect(owner).updateWbtcTokenAddress(wbtcToken.address);


    //Update the white lister address
    await w3m.connect(owner).updateWhiteListerAddress(addr1.address);


    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, wbtcToken};
  }

  it("19.1. Should revert transaction because of execution with address that's not on the white list", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wbtcToken } = await loadFixture(deployContractAndSetVariables);
    
    await expect( w3m.connect(addr2).investFromWbtc(ethers.utils.parseEther("0.25")))
    .to.be.revertedWith('Investor address has not been added to the white list');
  });

  it("19.2. Should revert transaction because it has not been approved in the WBTC smart contract", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wbtcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    await expect( w3m.connect(addr2).investFromWbtc(ethers.utils.parseEther("0.25")))
    .to.be.revertedWith('ERC20: insufficient allowance');
  });

  it("19.3. Should revert transaction because it doesn't meet the minimum investment requirement", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wbtcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the wbtc smart contract
    await wbtcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("0.0000001"));

    await expect( w3m.connect(addr2).investFromWbtc(ethers.utils.parseEther("0.0000001")))
    .to.be.revertedWith('The amount to invest must be greater than the minimum established');
  });

  it("19.4. Should revert transaction because the amount exceeds the maximum non qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wbtcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the WBTC smart contract
    await wbtcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("1"));

    await expect( w3m.connect(addr2).investFromWbtc(ethers.utils.parseEther("1")))
    .to.be.revertedWith('To buy that amount of W3M its required to be a qualified investor');
  });

  it("19.5. Should properly execute the function because it sends an amount below the qualified investor limit", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wbtcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Approve the spending of the crypto in the WBTC smart contract
    await wbtcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("0.25"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromWbtc(ethers.utils.parseEther("0.25"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

  it("19.6. Should properly execute the function because now the investor is registered as qualified investor", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wbtcToken } = await loadFixture(deployContractAndSetVariables);
    
    //Add investor address to the whitelist
    await w3m.connect(addr1).addToWhiteList(addr2.address);

    //Add investor address to the qualified investor list
    await w3m.connect(addr1).addToQualifiedInvestorList(addr2.address);

    //Approve the spending of the crypto in the WBTC smart contract
    await wbtcToken.connect(addr2).approve(w3m.address, ethers.utils.parseEther("1"));

    var booleanAnswerFromTransaction = await w3m.connect(addr2).callStatic.investFromWbtc(ethers.utils.parseEther("1"));

    expect(await booleanAnswerFromTransaction).to.equal(true);
  });

});


describe("Test case #20. Update W3M price in USD", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("20.1. Should revert transaction because of execution with no address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(addr1).updateW3mPrice(600000))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("20.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateW3mPrice(0))
    .to.be.revertedWith('Price of W3M token must be at least USD 0.005, that is 500000 with 8 decimals');
  });


  it("20.3. Should properly execute the function because it has a valid address and valid amount", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).updateW3mPrice(700000);

    expect(await w3m.w3mPrice()).to.equal(ethers.utils.parseUnits("0.007", 8));
  });

});



describe("Test case #21. Update minimum investment allowed in USD", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("21.1. Should revert transaction because of execution with address that's not the owners", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(addr1).updateMinimumInvestmentAllowedInUSD(ethers.utils.parseUnits("1", 18)))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("21.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateMinimumInvestmentAllowedInUSD(0))
    .to.be.revertedWith('New minimun amount to invest, must be greater than zero');
  });

  it("21.3. Should properly execute the function because it has a valid address and valid amount", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).updateMinimumInvestmentAllowedInUSD(ethers.utils.parseUnits("2", 18));

    expect(await w3m.minimumInvestmentAllowedInUSD()).to.equal(ethers.utils.parseUnits("2", 18));
  });

});


describe("Test case #22. Update maximum investment allowed in USD for non qualified investor", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("22.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(addr1).updateMaximumInvestmentAllowedInUSD(ethers.utils.parseUnits("20000", 18)))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("22.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateMaximumInvestmentAllowedInUSD(0))
    .to.be.revertedWith('New maximum amount to invest, must be greater than zero');
  });

  it("22.3. Should properly execute the function because it has a valid address and valid amount", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).updateMaximumInvestmentAllowedInUSD(ethers.utils.parseUnits("20000", 18));

    expect(await w3m.maximumInvestmentAllowedInUSD()).to.equal(ethers.utils.parseUnits("20000", 18));
  });

});


describe("Test case #23. Update white lister address", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("23.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(addr1).updateWhiteListerAddress('0x90F79bf6EB2c4f870365E785982E1f101E93b906'))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("23.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateWhiteListerAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The white lister address can not be the zero address');
  });

  it("23.3. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).updateWhiteListerAddress('0x90F79bf6EB2c4f870365E785982E1f101E93b906');

    expect(await w3m.whiteListerAddress()).to.equal('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  });

});



describe("Test case #24. Update treasury address", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("24.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(addr1).updateTreasuryAddress('0x90F79bf6EB2c4f870365E785982E1f101E93b906'))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("24.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateTreasuryAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The treasury address can not be the zero address');
  });

  it("24.3. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).updateTreasuryAddress('0x90F79bf6EB2c4f870365E785982E1f101E93b906');

    expect(await w3m.treasuryAddress()).to.equal('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  });

});


describe("Test case #25. Update MATIC price feed address", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Deploy the MATIC price data feed mock
    const MaticPriceDataFeedMock = await ethers.getContractFactory('MaticPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const maticPriceDataFeedMock = await MaticPriceDataFeedMock.deploy();

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, maticPriceDataFeedMock};
  }


  it("25.1. Should revert transaction because of execution with no address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, maticPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual MATIC price feed address on the local testnet
    await expect( w3m.connect(addr1).updateMaticPriceFeedAddress(maticPriceDataFeedMock.address))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("25.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateMaticPriceFeedAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The price data feed address can not be the zero address');
  });

  it("25.3. Should revert transaction because of execution with an address that's not a data feed", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3, maticPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    expect(w3m.connect(owner).updateMaticPriceFeedAddress(w3m.address))
    .to.be.revertedWith('The new address does not seem to belong to a MATIC price data feed');
  });

  it("25.4. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3, maticPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual MATIC price feed address on the local testnet
    await w3m.connect(owner).updateMaticPriceFeedAddress(maticPriceDataFeedMock.address);

    expect(await w3m.maticPriceFeedAddress()).to.equal(maticPriceDataFeedMock.address);
  });

});


describe("Test case #26. Update USDC token address in the polygon network", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("26.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDC token address on the polygon mainnet
    await expect( w3m.connect(addr1).updateUsdcTokenAddress('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("26.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateUsdcTokenAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The token address can not be the zero address');
  });

  it("26.3. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDC token address on the polygon mainnet
    await w3m.connect(owner).updateUsdcTokenAddress('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');

    expect(await w3m.usdcTokenAddress()).to.equal('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');
  });

});


describe("Test case #27. Update USDC price feed address", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Deploy the USDC price data feed mock
    const UsdcPriceDataFeedMock = await ethers.getContractFactory('UsdcPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const usdcPriceDataFeedMock = await UsdcPriceDataFeedMock.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, usdcPriceDataFeedMock};
  }


  it("27.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdcPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDC price feed address on the local testnet
    await expect( w3m.connect(addr1).updateUsdcPriceFeedAddress(usdcPriceDataFeedMock.address))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("27.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateUsdcPriceFeedAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The price data feed address can not be the zero address');
  });

  it("27.3. Should revert transaction because of execution with an address that's not a data feed", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(w3m.connect(owner).updateUsdcPriceFeedAddress(w3m.address))
    .to.be.revertedWith('The new address does not seem to belong to a USDC price data feed');
  });

  it("27.4. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3, usdcPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDC price feed address on the local testnet
    await w3m.connect(owner).updateUsdcPriceFeedAddress(usdcPriceDataFeedMock.address);

    expect(await w3m.usdcPriceFeedAddress()).to.equal(usdcPriceDataFeedMock.address);
  });

});


describe("Test case #28. Update USDT token address in the polygon network", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("28.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDT token address on the polygon mainnet
    await expect( w3m.connect(addr1).updateUsdtTokenAddress('0xc2132D05D31c914a87C6611C10748AEb04B58e8F'))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("28.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateUsdtTokenAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The token address can not be the zero address');
  });

  it("28.3. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDT token address on the polygon mainnet
    await w3m.connect(owner).updateUsdtTokenAddress('0xc2132D05D31c914a87C6611C10748AEb04B58e8F');

    expect(await w3m.usdtTokenAddress()).to.equal('0xc2132D05D31c914a87C6611C10748AEb04B58e8F');
  });

});


describe("Test case #29. Update USDT price feed address", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());

    //Deploy the USDT price data feed mock
    const UsdtPriceDataFeedMock = await ethers.getContractFactory('UsdtPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const usdtPriceDataFeedMock = await UsdtPriceDataFeedMock.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, usdtPriceDataFeedMock};
  }


  it("29.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, usdtPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDT price feed address on the local testnet
    await expect( w3m.connect(addr1).updateUsdtPriceFeedAddress(usdtPriceDataFeedMock.address))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("29.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateUsdtPriceFeedAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The price data feed address can not be the zero address');
  });

  it("29.3. Should revert transaction because of execution with an address that's not a data feed", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(w3m.connect(owner).updateUsdtPriceFeedAddress(w3m.address))
    .to.be.revertedWith('The new address does not seem to belong to a USDT price data feed');
  });

  it("29.4. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3, usdtPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual USDC price feed address on the local testnet
    await w3m.connect(owner).updateUsdtPriceFeedAddress(usdtPriceDataFeedMock.address);

    expect(await w3m.usdtPriceFeedAddress()).to.equal(usdtPriceDataFeedMock.address);
  });

});


describe("Test case #30. Update WBTC token address in the polygon network", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("30.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WBTC token address on the polygon mainnet
    await expect( w3m.connect(addr1).updateWbtcTokenAddress('0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("30.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateWbtcTokenAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The token address can not be the zero address');
  });

  it("230.3. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WBTC token address on the polygon mainnet
    await w3m.connect(owner).updateWbtcTokenAddress('0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6');

    expect(await w3m.wbtcTokenAddress()).to.equal('0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6');
  });

});


describe("Test case #31. Update WBTC price feed address", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());

    //Deploy the WBTC price data feed mock
    const WbtcPriceDataFeedMock = await ethers.getContractFactory('WbtcPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const wbtcPriceDataFeedMock = await WbtcPriceDataFeedMock.deploy();  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, wbtcPriceDataFeedMock};
  }


  it("31.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wbtcPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WBTC price feed address on the local testnet
    await expect( w3m.connect(addr1).updateWbtcPriceFeedAddress(wbtcPriceDataFeedMock.address))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("31.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateWbtcPriceFeedAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The price data feed address can not be the zero address');
  });

  it("31.3. Should revert transaction because of execution with an address that's not a data feed", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(w3m.connect(owner).updateWbtcPriceFeedAddress(w3m.address))
    .to.be.revertedWith('The new address does not seem to belong to a WBTC price data feed');
  });

  it("31.4. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3, wbtcPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WBTC price feed address on the local testnet
    await w3m.connect(owner).updateWbtcPriceFeedAddress(wbtcPriceDataFeedMock.address);

    expect(await w3m.wbtcPriceFeedAddress()).to.equal(wbtcPriceDataFeedMock.address);
  });

});


describe("Test case #32. Update WETH token address in the polygon network", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());

    //Deploy the WETH price data feed mock
    const WethPriceDataFeedMock = await ethers.getContractFactory('WethPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const wethPriceDataFeedMock = await WethPriceDataFeedMock.deploy();  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, wethPriceDataFeedMock};
  }


  it("32.1. Should revert transaction because of execution witha ddress that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WETH token address on the polygon mainnet
    await expect( w3m.connect(addr1).updateWethTokenAddress('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("32.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateWethTokenAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The token address can not be the zero address');
  });

  it("32.3. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WETH token address on the polygon mainnet
    await w3m.connect(owner).updateWethTokenAddress('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619');

    expect(await w3m.wethTokenAddress()).to.equal('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619');
  });

});


describe("Test case #33. Update WETH price feed address", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString()); 

    //Deploy the WETH price data feed mock
    const WethPriceDataFeedMock = await ethers.getContractFactory('WethPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const wethPriceDataFeedMock = await WethPriceDataFeedMock.deploy();  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3, wethPriceDataFeedMock};
  }


  it("33.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3, wethPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WETH price feed address on the local testnet
    await expect( w3m.connect(addr1).updateWethPriceFeedAddress(wethPriceDataFeedMock.address))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("33.2. Should revert transaction because of execution with invalid parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(owner).updateWethPriceFeedAddress(ethers.constants.AddressZero))
    .to.be.revertedWith('The price data feed address can not be the zero address');
  });

  it("33.3. Should revert transaction because of execution with an address that's not a data feed", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(w3m.connect(owner).updateWethPriceFeedAddress(w3m.address))
    .to.be.revertedWith('The new address does not seem to belong to a ETH price data feed');
  });

  it("33.4. Should properly execute the function because it has a valid address and valid parameter", async function () {
    const { w3m, owner, deployer, addr1, addr2, addr3, wethPriceDataFeedMock } = await loadFixture(deployContractAndSetVariables);

    //This is the actual WETH price feed address on the local testnet
    await w3m.connect(owner).updateWethPriceFeedAddress(wethPriceDataFeedMock.address);

    expect(await w3m.wethPriceFeedAddress()).to.equal(wethPriceDataFeedMock.address);
  });

});


describe("Test case #34. Pause smart contract", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("34.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(addr1).pause())
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("34.2. Should properly execute the function because it's done from the owner address", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).pause();

    await expect( w3m.connect(owner).transfer( w3m.address, ethers.utils.parseUnits("1000", 18)) )
    .to.be.revertedWith('ERC20Pausable: token transfer while paused');
  });

  it("34.3. Should properly execute the function because it's done from the owner address", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).pause();

    await expect( w3m.connect(owner).tokenIssuance(ethers.utils.parseUnits("1000", 18)) )
    .to.be.revertedWith('ERC20Pausable: token transfer while paused');
  });

});


describe("Test case #35. Unpause smart contract", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("35.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).pause();

    await expect( w3m.connect(addr1).unpause())
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("35.2. Should properly execute the function because it's done from the owner address", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).pause();

    await w3m.connect(owner).unpause();

    await w3m.transfer( addr1.address, ethers.utils.parseUnits("1000", 18)) ;

    expect(await w3m.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("1000", 18));
  });

  it("35.3. Should properly execute the function because it's done from the owner address", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.connect(owner).pause();

    await w3m.connect(owner).unpause();

    await w3m.connect(owner).tokenIssuance( ethers.utils.parseUnits("1000", 18)) ;

    expect(await w3m.totalSupply()).to.equal(ethers.utils.parseUnits("500001000", 18));
  });

});



describe("Test case #36. Transfer ownership", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }


  it("36.1. Should revert transaction because of execution with address that's not the owner", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.connect(addr1).transferOwnership(addr1.address))
    .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("36.2. Should revert transaction because of execution with invalid address parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.transferOwnership(ethers.constants.AddressZero))
    .to.be.revertedWith('Ownable: new owner is the zero address');
  });

  it("36.3. Should revert transaction because of execution with smart contract address parameter", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await expect( w3m.transferOwnership(w3m.address))
    .to.be.revertedWith('Ownable: new owner can not be the same contract address');
  });

  it("36.4. Should properly execute the function because it's done from the owner address", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    await w3m.transferOwnership(owner.address);

    expect(await w3m.owner()).to.equal(owner.address);
  });

});


describe("Test case #37. Get current MATIC price", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Deploy the MATIC price data feed mock
    const MaticPriceDataFeedMock = await ethers.getContractFactory('MaticPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const maticPriceDataFeedMock = await MaticPriceDataFeedMock.deploy();

    //Update the address of the MATIC price data feed mock
    await w3m.connect(owner).updateMaticPriceFeedAddress(maticPriceDataFeedMock.address);


    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("37.1. Should properly execute the function because it's reading the value parameter of the MATIC data price mock", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.getCurrentMaticPrice()).to.equal(90387255);
  });
  
});


describe("Test case #38. Get current USDC price", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Deploy the USDC price data feed mock
    const UsdcPriceDataFeedMock = await ethers.getContractFactory('UsdcPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const usdcPriceDataFeedMock = await UsdcPriceDataFeedMock.deploy();

    //Update the address of the USDC price data feed mock
    await w3m.connect(owner).updateUsdcPriceFeedAddress(usdcPriceDataFeedMock.address);

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("38.1. Should properly execute the function because it's reading the value parameter of the USDC data price mock", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.getCurrentUsdcPrice()).to.equal(100015613);
  });
  
});


describe("Test case #39. Get current USDT price", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Deploy the USDT price data feed mock
    const UsdtPriceDataFeedMock = await ethers.getContractFactory('UsdtPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const usdtPriceDataFeedMock = await UsdtPriceDataFeedMock.deploy();

    //Update the address of the USDT price data feed mock
    await w3m.connect(owner).updateUsdtPriceFeedAddress(usdtPriceDataFeedMock.address);

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("39.1. Should properly execute the function because it's reading the value parameter of the USDT data price mock", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.getCurrentUsdtPrice()).to.equal(100066361);
  });
  
});


describe("Test case #40. Get current WBTC price", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Deploy the WBTC price data feed mock
    const WbtcPriceDataFeedMock = await ethers.getContractFactory('WbtcPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const wbtcPriceDataFeedMock = await WbtcPriceDataFeedMock.deploy();

    //Update the address of the WBTC price data feed mock
    await w3m.connect(owner).updateWbtcPriceFeedAddress(wbtcPriceDataFeedMock.address);

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("40.1. Should properly execute the function because it's reading the value parameter of the WBTC data price mock", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.getCurrentWbtcPrice()).to.equal(3776334785000);
  });
  
});


describe("Test case #41. Get current WETH price", function () {
 
  //Create fixture to deploy smart contract and set initial variables
  async function deployContractAndSetVariables() {

    //Get signers (accounts) that will be testing the smart contract functions
    const [deployer, owner, addr1, addr2, addr3] = await ethers.getSigners();

    //Asociate the smart contract with its name in the context
    const W3M = await ethers.getContractFactory('W3M');

    //Deploy smart contract with established parameters
    const w3m = await W3M.deploy();

    //Line to transfer the W3M tokens from the deployer to the smart contract
    var totalSupplyHex = await w3m.totalSupply();
    await w3m.transfer( w3m.address, totalSupplyHex.toString());  

    //Transfer ownership of the W3M smart contract from the deployer to the owner
    await w3m.transferOwnership(owner.address); 

    //Deploy the WETH price data feed mock
    const WethPriceDataFeedMock = await ethers.getContractFactory('WethPriceDataFeedMock');

    //Deploy smart contract with established parameters
    const wethPriceDataFeedMock = await WethPriceDataFeedMock.deploy();

    //Update the address of the WETH price data feed mock
    await w3m.connect(owner).updateWethPriceFeedAddress(wethPriceDataFeedMock.address);

    //Return values as fixture for the testing cases
    return { w3m, deployer, owner, addr1, addr2, addr3};
  }

  it("41.1. Should properly execute the function because it's reading the value parameter of the WETH data price mock", async function () {
    const { w3m, deployer, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);

    expect(await w3m.getCurrentWethPrice()).to.equal(205980593600);
  });
  
});