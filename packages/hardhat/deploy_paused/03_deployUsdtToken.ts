import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployUsdtToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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
  await sleep(10000);

  await deploy("UsdtToken", {
    from: deployer,
    // Contract constructor arguments
    //args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  //Get the deployed contract
  const usdtToken = await hre.ethers.getContract("UsdtToken", deployer);

  //paste in your front-end address here to get 10000 Usdt Token Mockup on deploy:
  await sleep(5000);
  await usdtToken.transfer(
    "0x350441F8a82680a785FFA9d3EfEa60BB4cA417f8", hre.ethers.utils.parseUnits("100000", 18)
  );
  
};

export default deployUsdtToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployUsdtToken.tags = ["UsdtToken"];
