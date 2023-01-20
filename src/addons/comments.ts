export function commentsAddon(sourceCode: string): string {
    const compiledLines = sourceCode.split(/[\r\n]+/).map(line => line.split('#')[0].trim());
    const compiledCode = compiledLines.join('\r\n');
    return compiledCode;
}