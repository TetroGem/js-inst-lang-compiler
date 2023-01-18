import z from "zod";
import { AddressArgument, Instruction, MachineCode, Operation, Size, ValueArgument, parseSize, sizeSchema } from "./instructions";
import { opCodes } from "./ops";
import { validate } from "./safe-parse";

export function compile(sourceCode: string): DataView {
    const lines = sourceCode.split(/[\r\n]+/);
    const machineCode = new MachineCode();
    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const instruction = compileLine(line, i + 1);
        machineCode.addInstruction(instruction);
    }
    console.log(lines);

    return machineCode.buildBuffer();
}

function compileLine(line: string, lineNumber: number): Instruction {
    const parts = line.split(' ');
    if(parts.length !== 3) throw new Error(`Expected 3 parts on line (Found: ${line}, ${parts.length} parts)`)
    
    const operation = compileOperation(parts[0], lineNumber);
    const addressArg = compileAddressArgument(parts[1], lineNumber);
    const valueArg = compileValueArgument(parts[2], lineNumber);

    return new Instruction(operation, addressArg, valueArg);
}

function compileOperation(operation: string, lineNumber: number): Operation {
    const match = /([a-z]{3})(\d*)([a-z]?)/.exec(operation);
    if(match === null) throw new Error(`Operation is not structured correctly! (On line: ${lineNumber}, Found: ${operation})`);

    const typeRaw: string = match[1];
    const returnSizeRaw: string = match[2];
    const returnIsFloatRaw: string = match[3];

    let opCode: number;
    if(typeRaw in opCodes) opCode = opCodes[typeRaw as keyof typeof opCodes];
    else throw new Error(`${typeRaw} is not a valid operator! (On line: ${lineNumber})`);
    
    const returnSize = parseSize(returnSizeRaw, lineNumber, "Return size");

    const returnIsFloat = validate(
        returnIsFloatRaw,
        z.union([z.literal('f'), z.literal('')]).transform(flag => flag === 'f'),
        `Invalid float flag! (On line: ${lineNumber}, Found: '${returnIsFloatRaw}', Expected: 'f' | undefined)`
    );

    return new Operation(opCode, returnSize, returnIsFloat);
}

function compileAddressArgument(arg: string, lineNumber: number): AddressArgument {
    const match = /(-?\d+)([a-z]{1})(\d+)(\$(\d+))?(:(\d+))/.exec(arg);
    if(match === null) throw new Error(`Address argument is not structured correctly! (On line: ${lineNumber}, Found: ${arg})`);

    const literalRaw = match[1];
    const typeRaw = match[2];
    const sizeRaw = match[3];
    const isPointer = match[4] !== undefined;
    const pointerSizeRaw = match[5];
    const reachRaw = match[7];

    const { value, pointerSize, valueSize, reach, isFloat }
        = compileArgument(literalRaw, typeRaw, sizeRaw, isPointer, pointerSizeRaw, reachRaw, lineNumber);
    if(reach === null) throw new Error(`Address argument cannot parse reach! (On line: ${lineNumber}, Found: ${arg})`);

    return new AddressArgument(value, pointerSize, valueSize, reach, isFloat);
}

function compileValueArgument(arg: string, lineNumber: number): ValueArgument {
    const match = /(-?\d+)([a-z]{1})(\d+)(\$(\d+))?/.exec(arg);
    if(match === null) throw new Error(`Value argument is not structured correctly! (On line: ${lineNumber}, Found: ${arg})`);

    const literalRaw = match[1];
    const typeRaw = match[2];
    const sizeRaw = match[3];
    const isPointer = match[4] !== undefined;
    const pointerSizeRaw = match[5];

    const { value, pointerSize, valueSize, isFloat }
        = compileArgument(literalRaw, typeRaw, sizeRaw, isPointer, pointerSizeRaw, null, lineNumber);

    return new ValueArgument(value, pointerSize, valueSize, isFloat);
}

function compileArgument<R extends string | null>(
    literalRaw: string,
    typeRaw: string,
    sizeRaw: string,
    isPointer: boolean,
    pointerSizeRaw: string,
    reachRaw: R,
    lineNumber: number
) {
    const valueSize = parseSize(sizeRaw, lineNumber);
    const pointerSize: 0 | Size = isPointer ? parseSize(pointerSizeRaw, lineNumber, "Pointer size") : 0;
    const reach = reachRaw !== null ? parseSize(reachRaw, lineNumber, "Reach") : null;

    let valueNumber: number | bigint;
    let isSigned: boolean = false;
    let isFloat: boolean = false;
    switch(typeRaw) {
        case 'u': valueNumber = BigInt(literalRaw); break;
        case 'i': valueNumber = BigInt(literalRaw); isSigned = true; break;
        case 'f': valueNumber = parseFloat(literalRaw); isFloat = true; break;
        case 'c': valueNumber = BigInt(literalRaw.charCodeAt(0)); break;
        case 'x': valueNumber = BigInt(`0x${literalRaw}`); break;
        case 'b': valueNumber = BigInt(`0b${literalRaw}`); break;
        case 'o': valueNumber = BigInt(`0o${literalRaw}`); break;
        default: throw new Error(`Invalid type! (On line: ${lineNumber}, Found: '${typeRaw}', Expected: 'u' | 'i' | 'f' | 'c' | 'x' | 'b' | 'o')`);
    }

    const value = new DataView(new ArrayBuffer(valueSize));
    if(isSigned) {
        switch(valueSize) {
            case 8: value.setInt8(0, Number(valueNumber)); break;
            case 16: value.setInt16(0, Number(valueNumber)); break;
            case 32: value.setInt32(0, Number(valueNumber)); break;
            case 64: value.setBigInt64(0, BigInt(valueNumber)); break;
            default: throw new Error(`Invalid value size! (signed) (On line: ${lineNumber}, Found: '${valueSize}', Expected: 8 | 16 | 32 | 64)`);
        }
    } else if(isFloat) {
        switch(valueSize) {
            case 32: value.setFloat32(0, valueNumber as number); break;
            case 64: value.setFloat64(0, valueNumber as number); break;
            default: throw new Error(`Invalid value size! (float) (On line: ${lineNumber}, Found: '${valueSize}', Expected: 32 | 64)`);
        }
    } else {
        switch(valueSize) {
            case 8: value.setUint8(0, Number(valueNumber)); break;
            case 16: value.setUint16(0, Number(valueNumber)); break;
            case 32: value.setUint32(0, Number(valueNumber)); break;
            case 64: value.setBigUint64(0, BigInt(valueNumber)); break;
            default: throw new Error(`Invalid value size! (unsigned) (On line: ${lineNumber}, Found: '${valueSize}', Expected: 8 | 16 | 32 | 64)`);
        }
    }

    return {
        value,
        pointerSize,
        valueSize,
        reach,
        isFloat,
    };
}