import { Size, parseSize } from "../instructions";
import { matchAddressArgument, matchValueArgument, splitLine } from "../match";

const LABEL_DEFINE_PATTERN = /([A-Z]+):(\d+):/;
const LABEL_ARG_PATTERN = /~([A-Z]+)((\$\d+)?(:\d+)?[a-z]?)/;

export function labelsAddon(sourceCode: string): string {
    const lines = sourceCode.split(/[\r\n]+/).map(line => line.trim()).filter(line => line.length > 0);
    const labelSizes = findLabelSizes(lines);
    const labelAddresses = parseLabelAddresses(lines, labelSizes);
    const compiledLines = insertLabelsInto(lines, labelAddresses, labelSizes);
    const compiledCode = compiledLines.join('\r\n');
    return compiledCode;
}

function findLabelSizes(lines: string[]): Record<string, Size> {
    const labelSizes: Record<string, Size> = {};
    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        const labelDefineMatch = LABEL_DEFINE_PATTERN.exec(line);
        if(labelDefineMatch) {
            const { label, size } = parseLabelDefineParts(labelDefineMatch, lineNumber);
            if(label in labelSizes) throw new Error(`Duplicate label (On line: ${lineNumber}, Found: ${label})`);
            labelSizes[label] = size;
        }
    }

    return labelSizes;
}

function parseLabelDefineParts(match: RegExpExecArray, lineNumber: number) {
    const label = match[1];
    const size = parseSize(match[2], lineNumber);
    return { label, size };
}

function parseLabelAddresses(lines: string[], labelSizes: Record<string, Size>): Record<string, bigint> {
    const labels: Record<string, bigint> = {};
    let address = 0n;
    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        const labelDefineMatch = LABEL_DEFINE_PATTERN.exec(line);
        if(labelDefineMatch) {
            const { label } = parseLabelDefineParts(labelDefineMatch, lineNumber);
            labels[label] = address;
        } else {
            address += lineBytes(line, lineNumber, labelSizes);
        }
    }

    return labels;
}

function lineBytes(line: string, lineNumber: number, labelSizes: Record<string, Size>): bigint {
    let bytes = 3n; // all operations are 3 bytes

    const parts = line.split(' ');
    if(parts.length !== 3) throw new Error(`Expected 3 parts (On line: ${lineNumber}, Found: ${line}, ${parts.length} parts)`);
    const [operation, addressArg, valueArg] = parts;

    // get amount of bytes address argument takes up
    if(addressArg.startsWith('~')) {
        const label = addressArg.slice(1);
        if(!(label in labelSizes)) throw new Error(`Label not found: ${label}`);
        bytes += BigInt(labelSizes[label]) / 8n;
    } else {
        const { valueSize } = matchAddressArgument(addressArg, lineNumber);
        bytes += BigInt(valueSize) / 8n;
    }

    // get amount of bytes value argument takes up
    if(valueArg.startsWith('~')) {
        const label = valueArg.slice(1);
        if(!(label in labelSizes)) throw new Error(`Label not found: ${label}`);
        bytes += BigInt(labelSizes[label]) / 8n;
    } else {
        const { valueSize } = matchValueArgument(valueArg, lineNumber);
        bytes += BigInt(valueSize) / 8n;
    }

    return bytes;
}

function insertLabelsInto(lines: string[], labelAddresses: Record<string, bigint>, labelSizes: Record<string, Size>) {
    const compiledLines: string[] = [];
    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        if(line.endsWith(':')) continue;

        const [operation, addressArg, valueArg] = splitLine(line, lineNumber);
        let compiledParts: string[] = [operation];

        if(addressArg.startsWith('~')) {
            compiledParts.push(convertLabel(addressArg, labelAddresses, labelSizes, lineNumber));
        } else {
            compiledParts.push(addressArg);
        }

        if(valueArg.startsWith('~')) {
            compiledParts.push(convertLabel(valueArg, labelAddresses, labelSizes, lineNumber));
        } else {
            compiledParts.push(valueArg);
        }

        const compiledLine = compiledParts.join(' ');
        compiledLines.push(compiledLine);
    }

    return compiledLines;
}

function convertLabel(
    arg: string,
    labelAddresses: Record<string, bigint>, labelSizes: Record<string, Size>, lineNumber: number
): string {
    const match = LABEL_ARG_PATTERN.exec(arg);
    if(!match) throw new Error(`Invalid label (On line: ${lineNumber}, Found: ${arg})`);

    const label = match[1];
    const tail = match[2];
    if(!(label in labelAddresses)) throw new Error(`Label not found (On line: ${lineNumber}, Found: ${label})`);

    const address = labelAddresses[label];
    const size = labelSizes[label];
    return `${address}u${size}${tail}`;
}