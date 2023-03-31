import type ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
export declare class FromArgType {
    static validate(argName: string, argumentValue: any): void;
    static parse(argName: string, strValue: string): any;
}
export declare class AmountArgType {
    static validate(argName: string, argumentValue: any): void;
    static parse(argName: string, strValue: string): any;
}
export interface FuncTaskCommonArgs {
    name: string;
    func: string;
    args: string[];
    from: string;
    to: string;
}
interface ResolvedFuncArgs {
    contract: ethers.Contract;
    sender: ethers.Signer;
    unsignedTx: any;
}
export declare function resolveFuncArgs(taskArgs: FuncTaskCommonArgs, hre: HardhatRuntimeEnvironment): Promise<ResolvedFuncArgs>;
export interface NormalizeOpts {
    dec: boolean;
}
export declare function normalizeCallResult(res: any, opts?: NormalizeOpts): any;
export declare function normalizeRpcResult(obj: any, opts?: NormalizeOpts): any;
export declare function PluginError(message: string, parent?: Error | undefined): Error;
export declare function sleep(msec: number): Promise<void>;
export {};
//# sourceMappingURL=helpers.d.ts.map