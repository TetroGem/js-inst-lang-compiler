import { compile } from "../compile";

type Addon = (sourceCode: string) => string;

export function compileWithAddons(sourceCode: string, ...addons: Addon[]): DataView {
    let intermediateCode = sourceCode;
    for(const addon of addons) {
        intermediateCode = addon(intermediateCode);
    }
    return compile(intermediateCode);
}