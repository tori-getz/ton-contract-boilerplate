import { mnemonicNew } from "ton-crypto";
import { logger } from './util';
import * as fs from 'fs-extra';
import * as path from 'node:path';
import * as appRoot from 'app-root-path';

const CONFIG_FILENAME = 'deploy.config.json';

const createDeployConfig = async () => {
    logger.info(`* Create ${CONFIG_FILENAME}`);

    const configPath = path.resolve(appRoot.path, CONFIG_FILENAME);

    if (await fs.existsSync(configPath)) {
        logger.error(`${configPath} exists!`)
        return process.exit(1);
    }

    const deployerWallet = 'org.ton.wallets.v3.r2';
    const deployerMnemonic = (await mnemonicNew(24)).join(' ');

    logger.info(`  Wallet type: ${deployerWallet}`);
    logger.info(`  Mnemonic: ${deployerMnemonic}`);

    const config = { deployerWallet, deployerMnemonic };

    await fs.writeJSON(configPath, config, { spaces: 4 });

    logger.info(`* ${configPath} created!`)
}

createDeployConfig();
