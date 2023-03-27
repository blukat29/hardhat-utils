import { task } from "hardhat/config";

import "./type-extensions";

export const TASK_ADDR = "addr";

task(TASK_ADDR, "Get address of a deployed contract")
  .addPositionalParam("name", "Contract name")
  .setAction(async ({ name }, hre) => {
    const deployment = await hre.deployments.get(name);
    console.log(deployment.address);
  });
