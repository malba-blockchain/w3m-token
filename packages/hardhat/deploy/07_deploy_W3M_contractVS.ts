import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployW3MContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  await sleep(5000);

  await deploy("W3MS", {
    from: deployer,
    // Contract constructor arguments
    //args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract
  const w3m = await hre.ethers.getContract("W3MS", deployer);

  console.log("\nDeployer address: ",  deployer);

  await sleep(3000);
  
  //Validate the current deployer balance
  var deployerTokenBalance = await w3m.balanceOf(deployer);
  console.log("\nDeployer token balance: ", deployerTokenBalance.toString());


  //Address of the new owner of the smart contract
  const newOwnerAddress = "0x498C47066AdeB22Ba23953d890eD6b540411e350";

  // TRANSFER THE TOTAL SUPPLY TO THE NEW OWNER ADDRESS
  
  var totalSupplyHex = await w3m.totalSupply();
  console.log("Total supply: ",  totalSupplyHex.toString());

  await sleep(3000);

  await w3m.transfer( 
    w3m.address, totalSupplyHex.toString() //Line to transfer the W3M tokens from the deployer to the smart contract
    //newOwnerAddress, totalSupplyHex.toString() //Line to transfer the W3M tokens from the deployer to the new owner
  );

  await sleep(7000);
  
  var newOwnerTokenBalance = await w3m.balanceOf(newOwnerAddress);

  console.log("\nNew owner token balance: ", newOwnerTokenBalance.toString());

  var smartContractTokenBalance = await w3m.balanceOf(w3m.address);

  console.log("\nSmart contract token balance: ", smartContractTokenBalance.toString());
  
  // TRANSFER OWNERSHIP THE THE NEW OWNER ADDRESS
  
  const ownerTx = await w3m.transferOwnership(newOwnerAddress);

  await ownerTx.wait();
  
  console.log("\nOwnership transferred successfully to: ", await w3m.owner());

};

export default deployW3MContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployW3MContract.tags = ["W3MS"];
