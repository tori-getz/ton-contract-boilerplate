import * as path from 'node:path';
import { deployConfigCreated, DEPLOY_CONFIG_DIR, logger } from './util';

const isTestnet: boolean = process.env.npm_lifecycle_event === 'deploy:testnet';

const NETWORK: string = isTestnet ? 'testnet' : 'mainnet';
const ENDPOINT = `https://${isTestnet ? 'testnet.' : ''}toncenter/api/v2/jsonRPC`;

const deploy = async () => {
    logger.info('* Deploy');
    logger.info(`  Network: ${NETWORK}`);
    logger.info(`  Endpoint: ${ENDPOINT}`);

    if (!deployConfigCreated) {
        logger.error(`${DEPLOY_CONFIG_DIR} is not exists! start: yarn deploy:config`)
        return process.exit(1);
    }
}

deploy();
