import type ethers from "ethers"
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import "./type-extensions";

export const TASK_ABI = "abi";

task(TASK_ABI, "Get ABI of a contract")
  .addFlag("json", "print json abi")
  .addPositionalParam("name", "Contract name")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { name, json } = taskArgs;
    const formats = hre.ethers.utils.FormatTypes;

    const factory = await hre.ethers.getContractFactory(name);
    const iface = factory.interface;

    // See all FormatTypes: https://github.com/ethers-io/ethers.js/blob/v5.7/packages/abi/src.ts/fragments.ts#L235
    if (json) {
      console.log(iface.format(formats.json));
      return;
    }

    // TODO: pretty-print by aligning hashes
    for (const f of iface.fragments) {
      let decl = f.format(formats.full);
      let hash;
      switch (f.type) {
        case "function":
          hash = iface.getSighash(f);
          console.log(`${decl} // ${hash}`);
          break;
        case "event":
          hash = iface.getEventTopic(f as ethers.utils.EventFragment);
          console.log(`${decl} // ${hash}`);
          break;
        case "error":
        case "constructor":
          console.log(decl);
          break;
      }
    }
  });
