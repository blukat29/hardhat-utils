"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_FLAT = void 0;
const fs_1 = __importDefault(require("fs"));
const config_1 = require("hardhat/config");
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
require("./type-extensions");
const helpers_1 = require("./helpers");
exports.TASK_FLAT = "smart-flatten";
(0, config_1.task)(exports.TASK_FLAT, "Flatten source code of a contract and print compilation info")
    .addPositionalParam("nameOrPath", "Contract name or file path")
    .addOptionalPositionalParam("outputPath", "Path to write flattened file (default: *.flat.sol)", undefined)
    .addOptionalParam("forceLicense", "Override to a SPDX license", "")
    .addFlag("includeDev", "Include dev dependencies (hardhat/*.sol, forge-std/*.sol)")
    .addFlag("noCompile", "Do not compile before running")
    .setAction(async (taskArgs) => {
    const { nameOrPath, outputPath, forceLicense, includeDev, noCompile } = taskArgs;
    if (!noCompile) {
        await hre.run(task_names_1.TASK_COMPILE);
    }
    const resolved = await resolveSource(nameOrPath);
    resolved.sources.forEach((path) => {
        if (!includeDev && isDevDependency(path)) {
            throw (0, helpers_1.PluginError)(`Dependency '${path}' is for debugging. If you want to include it in the flattened file, add --include-dev flag.`);
        }
        ;
    });
    const flattened = await hre.run(task_names_1.TASK_FLATTEN_GET_FLATTENED_SOURCE, {
        files: [resolved.sourcePath]
    });
    const dedup = deduplicateLicenses(flattened, forceLicense);
    const metadata = Object.assign(Object.assign({}, resolved), { inputLicenses: dedup.inputLicenses, outputLicense: dedup.outputLicense });
    const finalSource = dedup.source;
    let flattenedPath;
    if (outputPath === undefined) {
        const filename = path_1.default.basename(resolved.sourcePath, ".sol") + ".flat.sol";
        flattenedPath = path_1.default.join(hre.config.paths.artifacts, filename);
    }
    else {
        flattenedPath = outputPath;
    }
    fs_1.default.writeFileSync(flattenedPath, finalSource);
    console.error(metadata);
    console.log(`\nFlattened source written to ${flattenedPath}\n`);
});
async function resolveSource(nameOrPath) {
    const resolved = {
        sourcePath: '',
        solcVersion: '',
        solcSettings: {
            optimizer: {},
        },
        sources: [],
    };
    if (isFilePath(nameOrPath)) {
        resolved.sourcePath = nameOrPath;
        const dependencyGraph = await hre.run(task_names_1.TASK_FLATTEN_GET_DEPENDENCY_GRAPH, {
            files: [resolved.sourcePath]
        });
        resolved.sources = dependencyGraph.getResolvedFiles().map((f) => f.sourceName);
        // Run a subset of the hardhat compile task to determine compiler config.
        const { jobs } = await hre.run(task_names_1.TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS, {
            dependencyGraph: dependencyGraph
        });
        const mergedJobs = await hre.run(task_names_1.TASK_COMPILE_SOLIDITY_MERGE_COMPILATION_JOBS, {
            compilationJobs: jobs
        });
        if (mergedJobs.length != 1) {
            throw (0, helpers_1.PluginError)(`Multiple mergedCompilationJob. Please report bug`);
        }
        const solcConfig = mergedJobs[0].getSolcConfig();
        resolved.solcVersion = solcConfig.version;
        resolved.solcSettings.optimizer = solcConfig.settings.optimizer;
    }
    else {
        const artifact = await hre.artifacts.readArtifact(nameOrPath);
        resolved.sourcePath = artifact.sourceName;
        const dependencyGraph = await hre.run(task_names_1.TASK_FLATTEN_GET_DEPENDENCY_GRAPH, {
            files: [resolved.sourcePath]
        });
        resolved.sources = dependencyGraph.getResolvedFiles().map((f) => f.sourceName);
        // Read build info to determine compiler config.
        const fqname = artifact.sourceName + ":" + artifact.contractName;
        const buildInfo = await hre.artifacts.getBuildInfo(fqname);
        if (!buildInfo) {
            throw (0, helpers_1.PluginError)(`Cannot read buildinfo for ${fqname}. Please report bug.`);
        }
        resolved.solcVersion = buildInfo.solcVersion;
        resolved.solcSettings.optimizer = buildInfo.input.settings.optimizer;
    }
    return resolved;
}
function isFilePath(path) {
    try {
        fs_1.default.accessSync(path, fs_1.default.constants.R_OK);
        return true;
    }
    catch (_a) {
        return false;
    }
}
function isDevDependency(path) {
    return lodash_1.default.startsWith(path, "lib/forge-std/") ||
        lodash_1.default.startsWith(path, "hardhat/");
}
function deduplicateLicenses(source, forceLicense) {
    const re = /\/\/\s*SPDX-License-Identifier:\s*(.+)/m;
    const licenses = [];
    let outputSource = "";
    for (const line of source.split('\n')) {
        const match = re.exec(line);
        if (match) {
            licenses.push(match[1]);
            outputSource += '\n';
        }
        else {
            outputSource += line + '\n';
        }
    }
    let outputLicense;
    if (forceLicense) {
        outputLicense = forceLicense;
    }
    else {
        const uniqLicenses = lodash_1.default.uniq(licenses);
        if (uniqLicenses.length == 0) {
            outputLicense = 'UNLICENSED';
        }
        else {
            outputLicense = uniqLicenses[uniqLicenses.length - 1];
        }
    }
    outputSource = `// SPDX-License-Identifier: ${outputLicense}\n` + outputSource;
    return {
        source: outputSource,
        inputLicenses: licenses,
        outputLicense: outputLicense,
    };
}
//# sourceMappingURL=flat.js.map