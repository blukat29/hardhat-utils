import _ from "lodash";

export class FromArgType {
  static validate(argName: string, argumentValue: any): void {
  }
  static parse(argName: string, strValue: string): any {
    if (/^\d+$/.test(strValue)) {
      return _.toNumber(strValue);
    } else {
      return strValue;
    }
  }
}
