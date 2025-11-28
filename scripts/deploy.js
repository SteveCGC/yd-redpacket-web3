const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account available. Check DEPLOYER_PRIVATE_KEY.");
  }

  const network = await deployer.provider.getNetwork();
  const balance = await deployer.provider.getBalance(deployer.address);

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network.name, "chainId:", network.chainId);
  console.log("Deployer balance (ETH):", ethers.formatEther(balance));

  const MessageLog = await ethers.getContractFactory("MessageLog");
  const messageLog = await MessageLog.deploy();
  await messageLog.waitForDeployment();
  const messageLogAddress = await messageLog.getAddress();
  console.log("MessageLog deployed to:", messageLogAddress);

  const RedPacket = await ethers.getContractFactory("RedPacket");
  const redPacket = await RedPacket.deploy();
  await redPacket.waitForDeployment();
  const redPacketAddress = await redPacket.getAddress();
  console.log("RedPacket deployed to:", redPacketAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
