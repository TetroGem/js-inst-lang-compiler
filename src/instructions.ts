import { z } from "zod";
import { validate } from "./safe-parse";

export type Size = 8 | 16 | 32 | 64;
export const sizeSchema = z.union([z.literal(8), z.literal(16), z.literal(32), z.literal(64)]);
export function parseSize(size: string, lineNumber: number, label = "Size"): Size {
    return validate(
        parseInt(size),
        sizeSchema,
        `${label} is not valid! (On line: ${lineNumber}, Found: '${size}', Expected: '8' | '16' | '32' | '64')`
    );
}

export class MachineCode {
    private instructions: Instruction[] = [];

    addInstruction(instruction: Instruction) {
        this.instructions.push(instruction);
    }

    buildBuffer(): DataView {
        const buffer = new DataView(new ArrayBuffer(this.byteSize));
        let index = 0;

        for(const instruction of this.instructions) {
            index = instruction.writeBytes(buffer, index);
        }

        return buffer;
    }

    get byteSize(): number {
        return this.instructions.reduce((sum, inst) => sum + inst.byteSize, 0);
    }
}

export class Instruction {
    constructor(
        readonly op: Operation,
        readonly addressArg: AddressArgument,
        readonly valueArg: ValueArgument
    ) { }

    get byteSize(): number {
        return 3 + this.addressArg.byteSize + this.valueArg.byteSize;
    }

    writeBytes(buffer: DataView, index: number): number {
        // 00000 00 0
        const operationByte =
            this.op.opCode << 3
            | this.op.returnSizeEncoded << 1
            | (this.op.returnIsFloat ? 1 : 0);

        // 000 00 00 0
        const addressArgByte =
            this.addressArg.pointerSizeEncoded << 5
            | this.addressArg.valueSizeEncoded << 3
            | this.addressArg.reachEncoded << 1
            | (this.addressArg.isFloat ? 1 : 0);

        // 000 00 00 0
        const valueArgByte =
            this.valueArg.pointerSizeEncoded << 5
            | this.valueArg.valueSizeEncoded << 3
            | (this.valueArg.isFloat ? 1 : 0);

        buffer.setUint8(index++, operationByte);
        buffer.setUint8(index++, addressArgByte);
        buffer.setUint8(index++, valueArgByte);

        switch(this.addressArg.valueSize) {
            case 8:
                buffer.setUint8(index, this.addressArg.value.getUint8(0));
                index += 1;
                break;
            case 16:
                buffer.setUint16(index, this.addressArg.value.getUint16(0));
                index += 2;
                break;
            case 32:
                buffer.setUint32(index, this.addressArg.value.getUint32(0));
                index += 4;
                break;
            case 64:
                buffer.setBigUint64(index, this.addressArg.value.getBigUint64(0));
                index += 8;
                break;
            default:
                throw new Error(`Invalid value size in address argument! (Found: ${this.addressArg.valueSize})`);
        }

        switch(this.valueArg.valueSize) {
            case 8:
                buffer.setUint8(index, this.valueArg.value.getUint8(0));
                index += 1;
                break;
            case 16:
                buffer.setUint16(index, this.valueArg.value.getUint16(0));
                index += 2;
                break;
            case 32:
                buffer.setUint32(index, this.valueArg.value.getUint32(0));
                index += 4;
                break;
            case 64:
                buffer.setBigUint64(index, this.valueArg.value.getBigUint64(0));
                index += 8;
                break;
            default:
                throw new Error(`Invalid value size in value argument! (Found: ${this.valueArg.valueSize})`);
        }

        return index;
    }
}

export class Operation {
    constructor(
        readonly opCode: number,
        readonly returnSize: number,
        readonly returnIsFloat: boolean
    ) { }

    get returnSizeEncoded(): number {
        switch(this.returnSize) {
            case 8: return 0;
            case 16: return 1;
            case 32: return 2;
            case 64: return 3;
            default: throw new Error(`Invalid return size in operation! (Found: ${this.returnSize})`);
        }
    }
}

export class AddressArgument {
    constructor(
        readonly value: DataView,
        readonly pointerSize: 0 | Size,
        readonly valueSize: Size,
        readonly reach: Size,
        readonly isFloat: boolean
    ) { }

    get valueSizeEncoded(): number {
        switch(this.valueSize) {
            case 8: return 0;
            case 16: return 1;
            case 32: return 2;
            case 64: return 3;
            default: throw new Error(`Invalid value size in address argument! (Found: ${this.valueSize})`);
        }
    }

    get pointerSizeEncoded(): number {
        switch(this.pointerSize) {
            case 0: return 0;
            case 8: return 1;
            case 16: return 2;
            case 32: return 3;
            case 64: return 4;
            default: throw new Error(`Invalid pointer size in address argument! (Found: ${this.pointerSize})`);
        }
    }

    get reachEncoded(): number {
        switch(this.reach) {
            case 8: return 0;
            case 16: return 1;
            case 32: return 2;
            case 64: return 3;
            default: throw new Error(`Invalid reach in address argument! (Found: ${this.reach})`);
        }
    }

    get byteSize(): number {
        return this.valueSize / 8;
    }
}

export class ValueArgument {
    constructor(
        readonly value: DataView,
        readonly pointerSize: 0 | Size,
        readonly valueSize: Size,
        readonly isFloat: boolean
    ) { }

    get valueSizeEncoded(): number {
        switch(this.valueSize) {
            case 8: return 0;
            case 16: return 1;
            case 32: return 2;
            case 64: return 3;
            default: throw new Error(`Invalid value size in value argument! (Found: ${this.valueSize})`);
        }
    }

    get pointerSizeEncoded(): number {
        switch(this.pointerSize) {
            case 0: return 0;
            case 8: return 1;
            case 16: return 2;
            case 32: return 3;
            case 64: return 4;
            default: throw new Error(`Invalid pointer size in value argument! (Found: ${this.pointerSize})`);
        }
    }

    get byteSize(): number {
        return this.valueSize / 8;
    }
}