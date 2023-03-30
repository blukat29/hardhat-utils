import type ethers from "ethers"
import { task } from "hardhat/config";
import _ from "lodash";
import * as _path from "path";

import { FromArgType, PluginError } from "./helpers";
import "./type-extensions";

export const TASK_ACCOUNTS = "accounts";
export const TASK_FAUCET = "faucet";
export const TASK_KEYSTORE_DECRYPT = "keystore-decrypt";
export const TASK_KEYSTORE_ENCRYPT = "keystore-encrypt";
export const TASK_KEYSTORE_KIP3 = "keystore-kip3";
export const TASK_MNEMONIC = "mnemonic";

const hardhatNetworkMnemonic = "test test test test test test test test test test test junk";

task(TASK_ACCOUNTS, "Get infromation about active accounts")
  .addOptionalParam("from", "Caller address or index", "", FromArgType)
  .addFlag("json", "Print output in json")
  .setAction(async (taskArgs) => {
    const { from, json } = taskArgs;

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

task(TASK_FAUCET, "Send some coins to other accounts")
  .addOptionalParam("from", "Sender address or index", 0, FromArgType)
  .addOptionalParam("to", "A comma-separated string of recipient addresses and indices. By default all signers", "")
  .addOptionalParam("amount", "Amount of coins to send in ETH", "1")
  .setAction(async (taskArgs) => {
    const { from, to, amount } = taskArgs;

    const sender = await hre.ethers.getSigner(from);
    const value = hre.ethers.utils.parseEther(amount);

    const recipients: string[] = [];
    if (to == "") {
      const allSigners = await hre.ethers.getSigners();
      for (const signer of allSigners) {
        recipients.push(await signer.getAddress());
      }
    } else {
      for (const token of _.split(to, ",")) {
        if (hre.ethers.utils.isAddress(token)) { // address
          recipients.push(token);
        } else if (/^\d+$/.test(token)) { // index
          const signer = await hre.ethers.getSigner(_.toNumber(token) as any);
          recipients.push(await signer.getAddress());
        } else {
          throw PluginError(`Not an address or index: ${token}`);
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

task(TASK_MNEMONIC, "Derive accounts from BIP-39 mnemonic")
  .addPositionalParam("words", "Mnemonic words", hardhatNetworkMnemonic)
  .addOptionalParam("path", "Derivation path", "m/44'/60'/0'/0/")
  .addOptionalParam("index", "A comma-separated string of indices or index ranges", "0-9")
  .setAction(async (taskArgs) => {
    const { words, path, index } = taskArgs;

    const indexRe = /^\d+$/;
    const rangeRe = /^(\d+)-(\d+)$/;
    let indices: number[] = [];
    for (let token of _.split(index, ',')) {
      token = _.trim(token);

      let match = token.match(indexRe);
      if (match) {
        indices.push(parseInt(match[0]));
        continue;
      }

      match = token.match(rangeRe)
      if (match) {
        let lo = parseInt(match[1]);
        let hi = parseInt(match[2]);
        if (lo > hi) {
          [ hi, lo ] = [ lo, hi ];
        }
        indices = _.concat(indices, _.range(lo, hi + 1));
      }
    }

    indices = _.sortedUniq(_.sortBy(indices));

    for (const i of indices) {
      const subpath = _path.join(path, i.toString());
      const wallet = hre.ethers.Wallet.fromMnemonic(words, subpath);
      console.log(i, wallet.address, wallet.privateKey);
    }
  });

