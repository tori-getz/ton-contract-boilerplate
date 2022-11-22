#!/usr/bin/env ts-node
import { mnemonicNew } from "ton-crypto";
import { DEPLOY_CONFIG_DIR, logger, argv } from './util';
import * as fs from 'fs-extra';

const createDeployConfig = async () => {
    logger.info(`* Create ${DEPLOY_CONFIG_DIR}`);

    if (!argv.apiToken) {
        logger.error('Please, provide --api-token');
        process.exit(1);
    }

    const configPath = DEPLOY_CONFIG_DIR;

    if (await fs.existsSync(configPath)) {
        logger.error(`${configPath} exists!`)
        return process.exit(1);
    }

    const deployerWallet = 'org.ton.wallets.v3.r2';
    const deployerMnemonic = (await mnemonicNew(24)).join(' ');

    logger.info(`  Wallet type: ${deployerWallet}`);
    logger.info(`  Mnemonic: ${deployerMnemonic}`);

    const config = {
        deployerWallet,
        deployerMnemonic,
        apiToken: argv.apiToken
    };

    await fs.writeJSON(configPath, config, { spaces: 4 });

    logger.info(`* ${configPath} created!`)
}

createDeployConfig();
