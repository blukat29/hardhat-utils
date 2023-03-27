import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import _ from "lodash";

import { FromArgType, resolveFuncArgs, normalizeCallResult, normalizeRpcResult } from "./helpers";
import "./type-extensions";

export const TASK_ADDR = "addr";
export const TASK_CALL = "call";
export const TASK_SEND = "send";

task(TASK_ADDR, "Get address of a deployed contract")
  .addOptionalPositionalParam("name", "Contract name", "")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { name } = taskArgs;
    if (name == "") {
      const deployments = await hre.deployments.all();
      console.log(_.mapValues(deployments, (d) => d.address));
    } else {
      const deployment = await hre.deployments.get(name);
      console.log(deployment.address);
    }
  });

// TODO: call and send: --gas-price, --gas-limit, --nonce
task(TASK_CALL, "Call a read-only function to a contract")
  .addOptionalParam("from", "Caller address or index", 0, FromArgType)
  .addOptionalParam("to", "Target address. Loaded from deployments if empty.", "")
  .addFlag("raw", "Print raw output")
  .addFlag("dec", "Print numbers in decimal (default is hex)")
  .addPositionalParam("name", "Contract name (example: 'Counter', 'src/Lock.sol:Lock')")
  .addPositionalParam("func", "Function name or signature (example: 'number()', 'balanceOf(address)')")
  .addVariadicPositionalParam("args", "call arguments", [])
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { func, raw, dec } = taskArgs;
    const { contract, sender, unsignedTx } = await resolveFuncArgs(taskArgs, hre);

    let output = await sender.call(unsignedTx);
    if (raw) {
      console.log(output);
    } else {
      let res = contract.interface.decodeFunctionResult(func, output);
      console.log(normalizeCallResult(res, { dec }));
    }
  });

task(TASK_SEND, "Send a transaction to a contract")
  .addOptionalParam("from", "Caller address or index", 0, FromArgType)
  .addOptionalParam("to", "Target address. Loaded from deployments if empty.", "")
  .addFlag("unsigned", "Print unsigned tx and exit")
  .addFlag("dec", "Print numbers in decimal (default is hex)")
  .addPositionalParam("name", "Contract name (example: 'Counter', 'src/Lock.sol:Lock')")
  .addPositionalParam("func", "Function name or signature (example: 'number()', 'balanceOf(address)')")
  .addVariadicPositionalParam("args", "call arguments", [])
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
		const { unsigned, dec } = taskArgs;
		const { sender, unsignedTx } = await resolveFuncArgs(taskArgs, hre);

		if (unsigned) {
			console.log(normalizeRpcResult(unsignedTx, { dec }));
			return;
		}

    // TODO: decode events
		let tx = await sender.sendTransaction(unsignedTx);
		let rc = await tx.wait();
		console.log(normalizeRpcResult(rc, { dec }));
  });
