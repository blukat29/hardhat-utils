import axios from "axios";
import type ethers from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import _ from "lodash";

import "./type-extensions";

export const TASK_ABI = "abi";
export const TASK_ABI_UPLOAD = "abi-upload";

task(TASK_ABI, "Get ABI of a contract")
  .addFlag("json", "print json abi")
  .addOptionalPositionalParam("name", "Contract name", "")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { name, json } = taskArgs;

    if (name == "") {
      const names = await hre.artifacts.getAllFullyQualifiedNames();
      for (const n of names) {
        let abi = stringifyAbi(hre, n, json);
        if (abi && abi.length > 0 && abi != "[]") {
          console.log(`\n# ${n}`);
          console.log(abi);
        }
      }
    } else {
      console.log(stringifyAbi(hre, name, json));
    }
  });

function stringifyAbi(hre: HardhatRuntimeEnvironment, name: string, json: boolean): any {
  const { abi } = hre.artifacts.readArtifactSync(name);
  const iface = new hre.ethers.utils.Interface(abi);

  // See all FormatTypes: https://github.com/ethers-io/ethers.js/blob/v5.7/packages/abi/src.ts/fragments.ts#L235
  const formats = hre.ethers.utils.FormatTypes;

  if (json) {
    return iface.format(formats.json);
  }

  // TODO: pretty-print by aligning hashes
  const out = [];
  for (const f of iface.fragments) {
    const decl = f.format(formats.full);
    let hash;
    switch (f.type) {
      case "function":
        hash = iface.getSighash(f);
        out.push(`${decl} // ${hash}`);
        break;
      case "event":
        hash = iface.getEventTopic(f as ethers.utils.EventFragment);
        out.push(`${decl} // ${hash}`);
        break;
      case "error":
      case "constructor":
        out.push(decl);
        break;
    }
  }
  return _.join(out, '\n');
}

task(TASK_ABI_UPLOAD, "Upload function and event signatures")
  .addFlag("byte4", "Upload to https://www.4byte.directory/")
  .addFlag("sigdb", "Upload to https://openchain.xyz/signatures")
  .addPositionalParam("name", "Contract name", "")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { byte4, sigdb, name } = taskArgs;

    let names: string[];
    if (name == "") {
      names = await hre.artifacts.getAllFullyQualifiedNames();
    } else {
      names = [ name ];
    }

    const abis = [];
    for (const n of names) {
      const { abi } = hre.artifacts.readArtifactSync(n);
      for (const frag of abi) {
        if (frag.type == 'function' || frag.type == 'event') {
          abis.push(frag);
        }
      }
    }
    console.log(`Uploading ${abis.length} function and event signatures..`);

    if (byte4) {
      console.log(await upload4bytes(abis));
    }
    if (sigdb) {
      console.log(await uploadSigdb(hre, abis));
    }
  });

// https://www.4byte.directory/docs/
const URL_4bytes = "https://www.4byte.directory/api/v1/import-abi/";
async function upload4bytes(abis: any[]): Promise<any> {
  console.log(`..to ${URL_4bytes}`);
  const data = { contract_abi: JSON.stringify(abis) };
  const res = await axios.post(URL_4bytes, data);
  return JSON.stringify(res.data, null, 2);
}

// https://docs.openchain.xyz/
const URL_sigdb = "https://api.openchain.xyz/signature-database/v1/import";
async function uploadSigdb(hre: HardhatRuntimeEnvironment, abis: any[]): Promise<any> {
  console.log(`..to ${URL_sigdb}`);
  const formats = hre.ethers.utils.FormatTypes;

  const functions: string[] = [];
  const events: string[] = [];
  for (const frag of abis) {
    if (frag.type == 'function') {
      const ffrag = hre.ethers.utils.FunctionFragment.fromObject(frag);
      functions.push(ffrag.format(formats.sighash));
    }
    if (frag.type == 'event') {
      const efrag = hre.ethers.utils.EventFragment.fromObject(frag);
      events.push(efrag.format(formats.sighash));
    }
  }
  const data = {
    'function': _.uniq(functions),
    'event': _.uniq(events)
  };

  const res = await axios.post(URL_sigdb, data);
  return JSON.stringify(res.data, null, 2);
}
