"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_SEND = exports.TASK_CALL = exports.TASK_ADDR = void 0;
const config_1 = require("hardhat/config");
const lodash_1 = __importDefault(require("lodash"));
const helpers_1 = require("./helpers");
require("./type-extensions");
exports.TASK_ADDR = "addr";
exports.TASK_CALL = "call";
exports.TASK_SEND = "send";
(0, config_1.task)(exports.TASK_ADDR, "Get address of a deployed contract")
    .addOptionalPositionalParam("name", "Contract name", "")
    .setAction(async (taskArgs, hre) => {
    const { name } = taskArgs;
    if (name == "") {
        const deployments = await hre.deployments.all();
        console.log(lodash_1.default.mapValues(deployments, (d) => d.address));
    }
    else {
        const deployment = await hre.deployments.get(name);
        console.log(deployment.address);
    }
});
// TODO: call and send: --gas-price, --gas-limit, --nonce
(0, config_1.task)(exports.TASK_CALL, "Call a read-only function to a contract")
    .addOptionalParam("from", "Caller address or index", 0, helpers_1.FromArgType)
    .addOptionalParam("to", "Target address. Loaded from deployments if empty.", "")
    .addFlag("raw", "Print raw output")
    .addFlag("dec", "Print numbers in decimal (default is hex)")
    .addPositionalParam("name", "Contract name (example: 'Counter', 'src/Lock.sol:Lock')")
    .addPositionalParam("func", "Function name or signature (example: 'number()', 'balanceOf(address)')")
    .addVariadicPositionalParam("args", "call arguments", [])
    .setAction(async (taskArgs, hre) => {
    const { func, raw, dec } = taskArgs;
    const { contract, sender, unsignedTx } = await (0, helpers_1.resolveFuncArgs)(taskArgs, hre);
    let output = await sender.call(unsignedTx);
    if (raw) {
        console.log(output);
    }
    else {
        let res = contract.interface.decodeFunctionResult(func, output);
        console.log((0, helpers_1.normalizeCallResult)(res, { dec }));
    }
});
(0, config_1.task)(exports.TASK_SEND, "Send a transaction to a contract")
    .addOptionalParam("from", "Caller address or index", 0, helpers_1.FromArgType)
    .addOptionalParam("to", "Target address. Loaded from deployments if empty.", "")
    .addFlag("unsigned", "Print unsigned tx and exit")
    .addFlag("dec", "Print numbers in decimal (default is hex)")
    .addPositionalParam("name", "Contract name (example: 'Counter', 'src/Lock.sol:Lock')")
    .addPositionalParam("func", "Function name or signature (example: 'number()', 'balanceOf(address)')")
    .addVariadicPositionalParam("args", "call arguments", [])
    .setAction(async (taskArgs, hre) => {
    const { unsigned, dec } = taskArgs;
    const { sender, unsignedTx } = await (0, helpers_1.resolveFuncArgs)(taskArgs, hre);
    if (unsigned) {
        console.log((0, helpers_1.normalizeRpcResult)(unsignedTx, { dec }));
        return;
    }
    // TODO: decode events
    let tx = await sender.sendTransaction(unsignedTx);
    let rc = await tx.wait();
    console.log((0, helpers_1.normalizeRpcResult)(rc, { dec }));
});
//# sourceMappingURL=deployments.js.map