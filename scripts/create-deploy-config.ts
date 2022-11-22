#!/usr/bin/env ts-node
import { mnemonicNew } from "ton-crypto";
import { DEPLOY_CONFIG_DIR, logger } from './util';
import * as fs from 'fs-extra';

const CONFIG_FILENAME = 'deploy.config.json';

const createDeployConfig = async () => {
    logger.info(`* Create ${CONFIG_FILENAME}`);

    const configPath = DEPLOY_CONFIG_DIR;

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
