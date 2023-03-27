import type ethers from "ethers"
import { task } from "hardhat/config";

import { FromArgType } from "./helpers";
import "./type-extensions";

export const TASK_ACCOUNTS = "accounts";

task(TASK_ACCOUNTS, "Get infromation about active accounts")
  .addOptionalParam("from", "Caller address or index", "", FromArgType)
  .addFlag("json", "Print output in json")
  .setAction(async ({ from, json }, hre) => {
    let signers: ethers.Signer[];
    if (from == "") {
      signers = await hre.ethers.getSigners();
    } else {
      signers = [await hre.ethers.getSigner(from)];
    }

    const out = [];
    for (const signer of signers) {
      const address = await signer.getAddress();
      const balance = hre.ethers.utils.formatEther(
        await hre.ethers.provider.getBalance(address)
      );
      out.push({ address, balance });
    }

    if (json) {
      console.log(JSON.stringify(out, null, 2));
    } else {
      out.forEach((info) => {
        console.log(info.address, info.balance);
      });
    }
  });

