import z from "zod";
import { AddressArgument, ByteCode, Instruction, Operation, Size, ValueArgument, parseSize } from "./instructions";
import { AddressArgumentMatch, OperationMatch, ValueArgumentMatch, matchLine } from "./match";
import { opCodes } from "./ops";
import { validate } from "./safe-parse";

export function compile(sourceCode: string): DataView {
    const lines = sourceCode.split(/[\r\n]+/);
    const byteCode = new ByteCode();
    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const instruction = compileLine(line, i + 1);
        byteCode.addInstruction(instruction);
    }
    console.log(lines);

    return byteCode.buildBuffer();
}

function compileLine(line: string, lineNumber: number): Instruction {
    const { operation: operationMatch, addressArg: addressArgMatch, valueArg: valueArgMatch } = matchLine(line, lineNumber);

    const operation = compileOperation(operationMatch, lineNumber);
    const addressArg = compileAddressArgument(addressArgMatch, lineNumber);
    const valueArg = compileValueArgument(valueArgMatch, lineNumber);

    return new Instruction(operation, addressArg, valueArg);
}

function compileOperation(operation: OperationMatch, lineNumber: number): Operation {
    const { opCode: opCodeRaw, returnSize: returnSizeRaw, returnFlag } = operation;

    let opCode: number;
    if(opCodeRaw in opCodes) opCode = opCodes[opCodeRaw as keyof typeof opCodes];
    else throw new Error(`${opCodeRaw} is not a valid operator! (On line: ${lineNumber})`);
    
    const returnSize = parseSize(returnSizeRaw, lineNumber, "Return size");

    const returnIsFloat = validate(
        returnFlag,
        z.union([z.literal('f'), z.literal('')]).transform(flag => flag === 'f'),
        `Invalid float flag! (On line: ${lineNumber}, Found: '${returnFlag}', Expected: 'f' | undefined)`
    );

    return new Operation(opCode, returnSize, returnIsFloat);
}

function compileAddressArgument(arg: AddressArgumentMatch, lineNumber: number): AddressArgument {
    const { literal, form, valueSize: valueSizeRaw, isPointer, pointerSize: pointerSizeRaw, reach: reachRaw, flag } = arg;

    const { value, pointerSize, valueSize, reach, isFloat }
        = compileArgument(literal, form, valueSizeRaw, isPointer, pointerSizeRaw, reachRaw, flag, lineNumber);
    if(reach === null) throw new Error(`Address argument cannot parse reach! (On line: ${lineNumber}, Found: ${arg})`);

    return new AddressArgument(value, pointerSize, valueSize, reach, isFloat);
}

function compileValueArgument(arg: ValueArgumentMatch, lineNumber: number): ValueArgument {
    const { literal, form, valueSize: valueSizeRaw, isPointer, pointerSize: pointerSizeRaw, flag } = arg;

    const { value, pointerSize, valueSize, isFloat }
        = compileArgument(literal, form, valueSizeRaw, isPointer, pointerSizeRaw, null, flag, lineNumber);

    return new ValueArgument(value, pointerSize, valueSize, isFloat);
}

function compileArgument<R extends string | null>(
    literalRaw: string,
    typeRaw: string,
    sizeRaw: string,
    isPointer: boolean,
    pointerSizeRaw: string,
    reachRaw: R,
    flag: string,
    lineNumber: number
) {
    const valueSize = parseSize(sizeRaw, lineNumber);
    const pointerSize: 0 | Size = isPointer ? parseSize(pointerSizeRaw, lineNumber, "Pointer size") : 0;
    const reach = reachRaw !== null ? parseSize(reachRaw, lineNumber, "Reach") : null;

    let valueNumber: number | bigint;
    let isSigned: boolean = false;
    let literalIsFloat: boolean = false;
    switch(typeRaw) {
        case 'u': valueNumber = BigInt(literalRaw); break;
        case 'i': valueNumber = BigInt(literalRaw); isSigned = true; break;
        case 'f': valueNumber = parseFloat(literalRaw); literalIsFloat = true; break;
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
    } else if(literalIsFloat) {
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

    const isFloat = validate(
        flag,
        z.union([z.literal('f'), z.literal('')]).transform(flag => flag === 'f'),
        `Invalid flag! (On line: ${lineNumber}, Found: '${flag}', Expected: 'f' | undefined)`
    );

    return {
        value,
        pointerSize,
        valueSize,
        reach,
        isFloat,
    };
}