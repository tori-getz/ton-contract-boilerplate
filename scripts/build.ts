import { FIFTLIB_PATH, FIFT_BIN, FUNC_BIN, logger } from "./util";
import * as fs from 'fs-extra';
import * as path from 'node:path';
import child_process from 'node:child_process';
import * as appRoot from 'app-root-path';
import glob from 'fast-glob';
import { Cell } from 'ton';

const BUILD_FOLDER = path.resolve(appRoot.path, 'build');
const ARTIFACTS_FOLDER = path.resolve(appRoot.path, 'build', 'artifacts');
const CONTRACTS_PATH = path.resolve(appRoot.path, 'contracts', '*.fc');

const build = async () => {
    logger.info('* Build contracts');

    logger.info('* Erase /build folder')
    await fs.remove(BUILD_FOLDER);
    await fs.ensureDir(BUILD_FOLDER);
    await fs.ensureDir(ARTIFACTS_FOLDER);

    logger.info('* Find root contracts');

    const rootContracts = await glob.sync(CONTRACTS_PATH)
    for (const rootContract of rootContracts) {
        logger.info(`  Found root contract: ${rootContract}... building`);

        const contractName = path.parse(rootContract).name;
        const contractPath = path.resolve(appRoot.path, 'contracts', rootContract);

        const fifArtifact = path.resolve(ARTIFACTS_FOLDER, `${contractName}.fif`);
        const fiftCellArtifact = path.resolve(ARTIFACTS_FOLDER, `${contractName}.cell.fif`);
        const cellArtifact = path.resolve(ARTIFACTS_FOLDER, `${contractName}.cell`);
        const hexArtifact = path.resolve(BUILD_FOLDER, `${contractName}.compiled.json`);

        await child_process.execSync(`${FUNC_BIN} -APS -o ${fifArtifact} ${contractPath}`);
        logger.info(`  + new artifact ${fifArtifact}`);

        let fiftCellSource = [
            // '"Asm.fif" include',
            await fs.readFileSync(fifArtifact).toString(),
            `boc>B "${cellArtifact}" B>file`
        ].join('\n');
        await fs.ensureFile(fiftCellArtifact);
        await fs.writeFileSync(fiftCellArtifact, fiftCellSource);
        logger.info(`  + new artifact ${fiftCellArtifact}`);

        console.log(process.env.FIFTPATH)

        await child_process.execSync(`${FIFT_BIN} -I ${FIFTLIB_PATH} ${fiftCellArtifact}`);

        const hex = Cell.fromBoc(fs.readFileSync(cellArtifact))[0].toBoc().toString('hex');
        fs.writeJSONSync(hexArtifact, { hex });
        logger.info(`  + new artifact ${hexArtifact}`);

        logger.info(`  ${contractName}.compiled.json created!`);
    }
}

build();
