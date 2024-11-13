const hre = require("hardhat");

async function main() {
    // コンストラクトのデプロイ
    const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
    const modelRegistry = await ModelRegistry.deploy();
    await modelRegistry.deployed();

    console.log("ModelRegistry deployed to:". modelRegistry.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });