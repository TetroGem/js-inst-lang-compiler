
export type LineMatch = ReturnType<typeof matchLine>;
export type OperationMatch = ReturnType<typeof matchOperation>;
export type AddressArgumentMatch = ReturnType<typeof matchAddressArgument>;
export type ValueArgumentMatch = ReturnType<typeof matchValueArgument>;

export function splitLine(str: string, lineNumber: number): [operation: string, addressArg: string, valueArg: string] {
    const parts = str.split(' ');
    if(parts.length !== 3) throw new Error(`Expected 3 parts (On line: ${lineNumber}, Found: ${str}, ${parts.length} parts)`);
    return parts as [string, string, string];
}

export function matchLine(str: string, lineNumber: number) {
    const [operationRaw, addressArgRaw, valueArgRaw] = splitLine(str, lineNumber);

    const operation = matchOperation(operationRaw, lineNumber);
    const addressArg = matchAddressArgument(addressArgRaw, lineNumber);
    const valueArg = matchValueArgument(valueArgRaw, lineNumber);

    return { operation, addressArg, valueArg };
}

export function matchOperation(str: string, lineNumber: number) {
    const OPERATION_REGEX = /([a-z]{3})(\d*)([a-z]?)/;
    const match = OPERATION_REGEX.exec(str);
    if(match === null) throw new Error(`Operation is not structured correctly! (On line: ${lineNumber}, Found: ${str})`);

    const opCode: string = match[1];
    const returnSize: string = match[2];
    const returnFlag: string = match[3];

    return { opCode, returnSize, returnFlag };
}

export function matchAddressArgument(str: string, lineNumber: number) {
    const ADDRESS_ARGUMENT_REGEX = /(-?[\da-z]+)([a-z]{1})(\d+)(\$(\d+))?(:(\d+))([a-z]?)/;
    const match = ADDRESS_ARGUMENT_REGEX.exec(str);
    if(match === null) throw new Error(`Address argument is not structured correctly! (On line: ${lineNumber}, Found: ${str})`);

    const literal = match[1];
    const form = match[2];
    const valueSize = match[3];
    const isPointer = match[4] !== undefined;
    const pointerSize = match[5];
    const reach = match[7];
    const flag = match[8];

    return { literal, form, valueSize, isPointer, pointerSize, reach, flag };
}

export function matchValueArgument(str: string, lineNumber: number) {
    const VALUE_ARGUMENT_REGEX = /(-?[\da-z]+)([a-z]{1})(\d+)(\$(\d+))?([a-z]?)/;
    const match = VALUE_ARGUMENT_REGEX.exec(str);
    if(match === null) throw new Error(`Value argument is not structured correctly! (On line: ${lineNumber}, Found: ${str})`);

    const literal = match[1];
    const form = match[2];
    const valueSize = match[3];
    const isPointer = match[4] !== undefined;
    const pointerSize = match[5];
    const flag = match[6];

    return { literal, form, valueSize, isPointer, pointerSize, flag };
}