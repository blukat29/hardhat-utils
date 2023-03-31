"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_MNEMONIC = exports.TASK_KEYSTORE_KIP3 = exports.TASK_KEYSTORE_ENCRYPT = exports.TASK_KEYSTORE_DECRYPT = exports.TASK_FAUCET = exports.TASK_ACCOUNTS = void 0;
const fs_1 = __importDefault(require("fs"));
const config_1 = require("hardhat/config");
const lodash_1 = __importDefault(require("lodash"));
const _path = __importStar(require("path"));
const readline_sync_1 = __importDefault(require("readline-sync"));
const helpers_1 = require("./helpers");
require("./type-extensions");
exports.TASK_ACCOUNTS = "accounts";
exports.TASK_FAUCET = "faucet";
exports.TASK_KEYSTORE_DECRYPT = "keystore-decrypt";
exports.TASK_KEYSTORE_ENCRYPT = "keystore-encrypt";
exports.TASK_KEYSTORE_KIP3 = "keystore-kip3";
exports.TASK_MNEMONIC = "mnemonic";
const hardhatNetworkMnemonic = "test test test test test test test test test test test junk";
(0, config_1.task)(exports.TASK_ACCOUNTS, "Get infromation about active accounts")
    .addOptionalParam("from", "Caller address or index", "", helpers_1.FromArgType)
    .addFlag("json", "Print output in json")
    .setAction(async (taskArgs) => {
    const { from, json } = taskArgs;
    let signers;
    if (from == "") {
        signers = await hre.ethers.getSigners();
    }
    else {
        signers = [await hre.ethers.getSigner(from)];
    }
    const out = [];
    for (const signer of signers) {
        const address = await signer.getAddress();
        const balance = hre.ethers.utils.formatEther(await hre.ethers.provider.getBalance(address));
        out.push({ address, balance });
    }
    if (json) {
        console.log(JSON.stringify(out, null, 2));
    }
    else {
        out.forEach((info) => {
            console.log(info.address, info.balance);
        });
    }
});
(0, config_1.task)(exports.TASK_FAUCET, "Send some coins to other accounts")
    .addOptionalParam("from", "Sender address or index", 0, helpers_1.FromArgType)
    .addOptionalParam("to", "A comma-separated string of recipient addresses and indices. By default all signers", "")
    .addOptionalParam("amount", "Amount of coins to send in ETH", "1")
    .setAction(async (taskArgs) => {
    const { from, to, amount } = taskArgs;
    const sender = await hre.ethers.getSigner(from);
    const value = hre.ethers.utils.parseEther(amount);
    const recipients = [];
    if (to == "") {
        const allSigners = await hre.ethers.getSigners();
        for (const signer of allSigners) {
            recipients.push(await signer.getAddress());
        }
    }
    else {
        for (const token of lodash_1.default.split(to, ",")) {
            if (hre.ethers.utils.isAddress(token)) { // address
                recipients.push(token);
            }
            else if (/^\d+$/.test(token)) { // index
                const signer = await hre.ethers.getSigner(lodash_1.default.toNumber(token));
                recipients.push(await signer.getAddress());
            }
            else {
                throw (0, helpers_1.PluginError)(`Not an address or index: ${token}`);
            }
        }
    }
    console.log(`Send from ${sender.address} to ${recipients.length} accounts ${amount} ETH each`);
    const txs = [];
    for (const recipient of recipients) {
        const tx = await sender.sendTransaction({
            to: recipient,
            value: value
        });
        txs.push(tx.wait());
    }
    const rcs = await Promise.all(txs);
    for (const rc of rcs) {
        console.log(`to ${rc.to} txid ${rc.transactionHash}`);
    }
});
(0, config_1.task)(exports.TASK_KEYSTORE_DECRYPT, "Decrypt a keystore.json and print the private key")
    .addPositionalParam("file", "Keystore file")
    .addOptionalParam("password", "Keystore password", undefined)
    .setAction(async (taskArgs) => {
    let { file, password } = taskArgs;
    let keystore = JSON.parse(fs_1.default.readFileSync(file).toString());
    if (keystore.version == 4) {
        keystore = convertKeystoreV4(keystore);
    }
    if (password === undefined) {
        password = readline_sync_1.default.question("Keystore password: ", { hideEchoBack: true });
    }
    let keystoreStr = JSON.stringify(keystore);
    let wallet = hre.ethers.Wallet.fromEncryptedJsonSync(keystoreStr, password);
    console.log(wallet.address, wallet.privateKey);
});
(0, config_1.task)(exports.TASK_KEYSTORE_ENCRYPT, "Encrypt a private into a keystore.json")
    .addOptionalPositionalParam("priv", "Private key", undefined)
    .addOptionalParam("password", "Keystore password", undefined)
    .setAction(async (taskArgs) => {
    let { priv, password } = taskArgs;
    if (priv == undefined) {
        priv = readline_sync_1.default.question("Private key: ", { hideEchoBack: true });
    }
    if (password === undefined) {
        password = readline_sync_1.default.question("Keystore password: ", { hideEchoBack: true });
    }
    const wallet = new hre.ethers.Wallet(priv);
    const keystore = await wallet.encrypt(password);
    console.log(keystore);
});
(0, config_1.task)(exports.TASK_KEYSTORE_KIP3, "Convert KIP-3 keystore v4 into keystore v3")
    .addPositionalParam("input", "Input v4 file")
    .addOptionalPositionalParam("output", "Output file. If omitted, printed to stdout", undefined)
    .addFlag("silent", "Silently exit on error")
    .setAction(async (taskArgs) => {
    const { input, output, silent } = taskArgs;
    let keystore;
    try {
        keystore = JSON.parse(fs_1.default.readFileSync(input).toString());
        if (!isKeystore(keystore)) {
            throw new Error(`Not a keystore: ${input}`);
        }
    }
    catch (e) {
        if (silent) {
            return;
        }
        else {
            throw e;
        }
    }
    if (keystore.version == 4) {
        keystore = convertKeystoreV4(keystore);
    }
    const keystoreStr = JSON.stringify(keystore);
    if (output == undefined) {
        console.log(keystoreStr);
    }
    else {
        fs_1.default.writeFileSync(output, keystoreStr);
    }
});
(0, config_1.task)(exports.TASK_MNEMONIC, "Derive accounts from BIP-39 mnemonic")
    .addPositionalParam("words", "Mnemonic words", hardhatNetworkMnemonic)
    .addOptionalParam("path", "Derivation path", "m/44'/60'/0'/0/")
    .addOptionalParam("index", "A comma-separated string of indices or index ranges", "0-9")
    .setAction(async (taskArgs) => {
    const { words, path, index } = taskArgs;
    const indexRe = /^\d+$/;
    const rangeRe = /^(\d+)-(\d+)$/;
    let indices = [];
    for (let token of lodash_1.default.split(index, ',')) {
        token = lodash_1.default.trim(token);
        let match = token.match(indexRe);
        if (match) {
            indices.push(parseInt(match[0]));
            continue;
        }
        match = token.match(rangeRe);
        if (match) {
            let lo = parseInt(match[1]);
            let hi = parseInt(match[2]);
            if (lo > hi) {
                [hi, lo] = [lo, hi];
            }
            indices = lodash_1.default.concat(indices, lodash_1.default.range(lo, hi + 1));
        }
    }
    indices = lodash_1.default.sortedUniq(lodash_1.default.sortBy(indices));
    for (const i of indices) {
        const subpath = _path.join(path, i.toString());
        const wallet = hre.ethers.Wallet.fromMnemonic(words, subpath);
        console.log(i, wallet.address, wallet.privateKey);
    }
});
// Heuristically detect keystore v3 or v4
function isKeystore(keystore) {
    const uuidRe = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
    if (!uuidRe.test(keystore === null || keystore === void 0 ? void 0 : keystore.id)) {
        return false;
    }
    if (!lodash_1.default.isNumber(keystore === null || keystore === void 0 ? void 0 : keystore.version)) {
        return false;
    }
    if (keystore.version == 3 && keystore.crypto) {
        return true;
    }
    else if (keystore.version == 4 && keystore.keyring) {
        return true;
    }
    else {
        return false;
    }
}
// Convert KIP-3 (V4) keystore to the standard V3
// See https://kips.klaytn.foundation/KIPs/kip-3
function convertKeystoreV4(keystore) {
    let keyring = keystore.keyring;
    let crypto;
    if (lodash_1.default.isArray(keyring[0])) {
        crypto = keyring[0][0];
    }
    else {
        crypto = keyring[0];
    }
    keystore.crypto = crypto;
    keystore.version = 3;
    delete keystore.keyring;
    return keystore;
}
//# sourceMappingURL=accounts.js.map