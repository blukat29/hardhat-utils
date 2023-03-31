"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.PluginError = exports.normalizeRpcResult = exports.normalizeCallResult = exports.resolveFuncArgs = exports.AmountArgType = exports.FromArgType = void 0;
const plugins_1 = require("hardhat/plugins");
const lodash_1 = __importDefault(require("lodash"));
class FromArgType {
    static validate(argName, argumentValue) {
    }
    static parse(argName, strValue) {
        if (/^\d+$/.test(strValue)) {
            return lodash_1.default.toNumber(strValue);
        }
        else {
            return strValue;
        }
    }
}
exports.FromArgType = FromArgType;
class AmountArgType {
    static validate(argName, argumentValue) {
    }
    static parse(argName, strValue) {
        if (/^\d+$/.test(strValue)) {
            return lodash_1.default.toNumber(strValue);
        }
        else {
            return strValue;
        }
    }
}
exports.AmountArgType = AmountArgType;
async function resolveFuncArgs(taskArgs, hre) {
    const { name, func, args, from, to } = taskArgs;
    let contract;
    if (to == "") {
        const deployment = await hre.deployments.get(name);
        contract = new hre.ethers.Contract(deployment.address, deployment.abi);
    }
    else {
        contract = await hre.ethers.getContractAt(name, to);
    }
    const sender = await hre.ethers.getSigner(from);
    //console.log(await sender.getAddress());
    const unsignedTx = await contract
        .connect(sender)
        .populateTransaction[func](...args);
    //console.log(utx);
    return { contract, sender, unsignedTx };
}
exports.resolveFuncArgs = resolveFuncArgs;
function normalizeItem(item, opts) {
    if ((item === null || item === void 0 ? void 0 : item.constructor.name) == "BigNumber") {
        if (opts === null || opts === void 0 ? void 0 : opts.dec) {
            return item.toString();
        }
        else {
            return item.toHexString();
        }
    }
    else {
        return item;
    }
}
function normalizeCallResult(res, opts) {
    if (lodash_1.default.isArray(res)) {
        let out = new Array(res.length);
        for (var i = 0; i < res.length; i++) {
            out[i] = normalizeItem(res[i], opts);
        }
        return out;
    }
    else {
        return normalizeItem(res, opts);
    }
}
exports.normalizeCallResult = normalizeCallResult;
function normalizeRpcResult(obj, opts) {
    lodash_1.default.forOwn(obj, (val, key) => {
        obj[key] = normalizeItem(obj[key], opts);
    });
    return obj;
}
exports.normalizeRpcResult = normalizeRpcResult;
function PluginError(message, parent) {
    return new plugins_1.HardhatPluginError("hardhat-utils", message, parent);
}
exports.PluginError = PluginError;
async function sleep(msec) {
    await new Promise(resolve => setTimeout(resolve, msec));
}
exports.sleep = sleep;
//# sourceMappingURL=helpers.js.map