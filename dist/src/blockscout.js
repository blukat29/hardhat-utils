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
exports.TASK_EXPLORER = void 0;
const axios_1 = __importStar(require("axios"));
const child_process_1 = __importDefault(require("child_process"));
const config_1 = require("hardhat/config");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const helpers_1 = require("./helpers");
require("./type-extensions");
exports.TASK_EXPLORER = "explorer";
(0, config_1.task)(exports.TASK_EXPLORER, "Launch blockscout explorer")
    .addOptionalParam("host", "HTTP hostname", "0.0.0.0")
    .addOptionalParam("port", "HTTP port", "4000")
    .addFlag("restart", "Restart container if there is one currently running")
    .addFlag("stop", "Stop containers and exit")
    .addOptionalParam("explorerVersion", "Blockscout version (currently only supports 4.x.y)", "4.1.8")
    .setAction(async (taskArgs) => {
    const { host, port, stop, restart, explorerVersion } = taskArgs;
    const url = `http://localhost:${port}`;
    const disableTracer = await shouldDisableTracer();
    const extraEnvs = {
        'DOCKER_TAG': explorerVersion,
        'DOCKER_LISTEN': `${host}:${port}`,
        'DOCKER_DISABLE_TRACER': lodash_1.default.toString(disableTracer),
    };
    lodash_1.default.assign(process_1.default.env, extraEnvs);
    console.log('[+] Using env:', extraEnvs);
    const dir = path_1.default.resolve(__dirname, "../fixtures/blockscout");
    process_1.default.chdir(dir);
    // Start containers
    if (stop) {
        stopServer();
        return;
    }
    else if (restart) {
        stopServer();
    }
    startServer();
    // Wait for server
    const ok = await waitServer(url);
    if (!ok) {
        stopServer();
        throw (0, helpers_1.PluginError)("Cannot connect to explorer");
    }
    console.log('Blockscout explorer is running. To stop:');
    console.log('\n  npx hardhat explorer --stop\n');
    // Source code verify
    console.log("[+] Uploading source code of deployed contracts..");
    try {
        await verifyBatch(url);
    }
    catch (_a) {
        console.log('[+] Failed to upload source code.. skipping');
    }
});
function startServer() {
    child_process_1.default.execFileSync("docker-compose", ["up", "-d"], { stdio: 'inherit' });
}
function stopServer() {
    child_process_1.default.execFileSync("docker-compose", ["down"], { stdio: 'inherit' });
}
async function shouldDisableTracer() {
    try {
        await hre.ethers.provider.send("debug_traceTransaction", [hre.ethers.constants.HashZero, { tracer: "callTracer" }]);
    }
    catch (e) {
        if (e instanceof Error && e.message.includes("non-default tracer not supported yet")) {
            return true; // anvil does not support tracers
        }
    }
    return false; // otherwise leave it up to Blockscout.
}
async function waitServer(url, maxRetry = 10) {
    process_1.default.stdout.write(`[+] Waiting for ${url} to be online.. `);
    while (maxRetry--) {
        try {
            const ret = await axios_1.default.get(url);
            if (ret.status == 200) {
                break;
            }
            else {
                console.log(`ret.status ret.statusText`);
            }
        }
        catch (e) {
            if (e instanceof axios_1.AxiosError) {
                console.log(e.code);
            }
            else {
                throw e;
            }
        }
        await (0, helpers_1.sleep)(3000);
        process_1.default.stdout.write('Retrying.. ');
    }
    if (maxRetry == 0) {
        return false;
    }
    console.log(`Server is up!`);
    console.log(`\n  Go to ${url} in your browser.\n`);
    return true;
}
async function verifyBatch(url) {
    // hardhat-deploy's etherscan-verify task will control upload speed
    // to obey rate limit. Therefore we run multiple commands in parallel.
    const deployments = await hre.deployments.all();
    const promises = [];
    for (const name of lodash_1.default.keys(deployments)) {
        promises.push(hre.run("etherscan-verify", { apiUrl: url, contractName: name }));
    }
    await Promise.all(promises);
}
//# sourceMappingURL=blockscout.js.map