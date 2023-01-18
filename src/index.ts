import fs from 'fs/promises';
import path from 'path';
import { compile } from './compile';

const filename = path.resolve(process.argv[2]);

async function main() {
    const sourceFile = await fs.open(path.resolve(filename), 'r');
    const sourceCode = await fs.readFile(sourceFile, 'utf8');

    const machineCode = compile(sourceCode);

    const basename = path.basename(filename, '.txt');
    const writeFilename = `./out/${basename}.bin`;
    const binFile = await fs.open(path.resolve(writeFilename), 'w');
    await fs.writeFile(binFile, machineCode);
}

main();