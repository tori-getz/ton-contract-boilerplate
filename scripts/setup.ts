import { logger,getPlatform } from "./util";
import * as path from 'node:path';
import * as appRoot from 'app-root-path';
import * as fs from 'fs-extra';
import child_process from 'child_process';

interface IPackage {
    url: string
    name: string
    command: string
}

const PLATFORM = getPlatform();

const BIN_FOLDER = path.resolve(appRoot.path, 'bin');
const TEMP_FOLDER = path.resolve(BIN_FOLDER, 'temp');

const packages: Array<IPackage> = [
    {
        url: `https://github.com/ton-defi-org/ton-binaries/releases/download/${PLATFORM}/func`,
        name: 'func',
        command: `cp ${path.resolve(TEMP_FOLDER, 'func')} ${path.resolve(BIN_FOLDER, 'func')} && chmod +x ${path.resolve(BIN_FOLDER, 'func')}`
    },
    {
        url: `https://github.com/ton-defi-org/ton-binaries/releases/download/${PLATFORM}/fift`,
        name: 'fift',
        command: `cp ${path.resolve(TEMP_FOLDER, 'fift')} ${path.resolve(BIN_FOLDER, 'fift')} && chmod +x ${path.resolve(BIN_FOLDER, 'fift')}`
    },
    {
        url: 'https://github.com/ton-defi-org/ton-binaries/releases/download/fiftlib/fiftlib.zip',
        name: 'fiftlib.zip',
        command: `unzip ${path.resolve(TEMP_FOLDER, 'fiftlib.zip')} -d ${path.resolve(BIN_FOLDER, 'fiftlib')}`
    }
];

const setup = async () => {
    const packagesList = packages.map(p => p.name);

    if (fs.existsSync( BIN_FOLDER)) {
        logger.error(`${packagesList.join(', ')} is installed!`);
        return process.exit(1);
    }

    logger.info('* Create /bin folder');
    await fs.ensureDir(BIN_FOLDER);
    await fs.ensureDir(TEMP_FOLDER)

    logger.info(`* Install packages to /bin: ${packagesList.join(', ')} (Platform: ${PLATFORM})`)
    for (const pkg of packages) {
        logger.info(`  ${pkg.name}`);

        logger.info(`  - Downloading: ${pkg.url}`);
        await child_process.execSync(`wget ${pkg.url} --quiet -P ${TEMP_FOLDER}`)

        logger.info(`  - Execute: ${pkg.command}`);
        await child_process.execSync(pkg.command);

        logger.info(`  ${pkg.name} installed.`);
    }

    logger.info(`* Done`);
}

setup();
