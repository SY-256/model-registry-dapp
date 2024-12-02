const hre = require("hardhat");

async function main() {
    // アカウントの取得
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account: ", deployer.address);
    
    // コンストラクトのデプロイ
    const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
    console.log("Deploying ModelRegistry...");

    const modelRegistry = await ModelRegistry.deploy();
    await modelRegistry.deployed();

    // const deployedAddress = await modelRegistry.getAddress()
    console.log("ModelRegistry deployed to:", modelRegistry.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });