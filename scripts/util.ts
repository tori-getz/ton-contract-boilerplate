import pino from 'pino';
import * as fs from 'fs-extra';
import ini from 'ini';
import * as path from 'node:path';
import * as appRoot from 'app-root-path';

interface ILsbRelease {
    DISTRIB_ID: string
    DISTRIB_RELEASE: string
}

export const BIN_FOLDER = path.resolve(appRoot.path, 'bin');

export const FUNC_BIN = './bin/func';
export const FIFT_BIN = `./bin/fift`;
export const FIFTLIB_PATH = path.resolve(BIN_FOLDER, 'fiftlib');

export const logger = pino({
    transport: {
        target: 'pino-pretty'
    }
});

export const getPlatform = (): string => {
    try {
        if (process.platform === 'darwin') {
            if (process.arch === 'arm64') {
                return 'macos-m1-0.3.0'
            } else {
                return 'macos-intel'
            }
        }

        if (process.platform === 'win32') {
            return 'windows-64'
        }

        const lsbReleaseFile = fs.readFileSync('/etc/lsb-release', 'utf-8');
        const { DISTRIB_ID, DISTRIB_RELEASE } = ini.parse(lsbReleaseFile) as ILsbRelease;

        if (DISTRIB_ID === 'Ubuntu') {
            const version: number = parseInt(DISTRIB_RELEASE.split('.')[0]);

            if (version >= 18) {
                return 'ubuntu-18-0.3.0';
            } else {
                return 'ubuntu-16'
            }
        }

        return 'debian-10';
    } catch (e) {
        return 'debian-10'
    }
}
