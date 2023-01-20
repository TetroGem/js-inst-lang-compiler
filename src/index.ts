import fs from 'fs/promises';
import path from 'path';
import { compileWithAddons } from './addons/compile-addons';
import { labelsAddon } from './addons/labels';
import { commentsAddon } from './addons/comments';

const filename = path.resolve(process.argv[2]);

async function main() {
    const sourceFile = await fs.open(path.resolve(filename), 'r');
    const sourceCode = await fs.readFile(sourceFile, 'utf8');

    const machineCode = compileWithAddons(sourceCode, commentsAddon, labelsAddon);

    const basename = path.basename(filename, '.txt');
    const writeFilename = `./out/${basename}.bin`;
    const binFile = await fs.open(path.resolve(writeFilename), 'w');
    await fs.writeFile(binFile, machineCode);
}

main();