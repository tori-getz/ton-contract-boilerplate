import * as path from 'node:path';
import {
    Cell,
    CellMessage,
    CommonMessageInfo,
    contractAddress,
    fromNano,
    InternalMessage,
    SendMode,
    StateInit,
    toNano,
    TonClient,
    WalletContract,
    WalletV3R2Source
} from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { deployConfigCreated, DEPLOY_CONFIG_DIR, loadDeployConfig, logger, sleep } from './util';
import glob from 'fast-glob';
import appRoot from 'app-root-path';
import * as fs from 'fs-extra';

const isTestnet: boolean = process.env.npm_lifecycle_event === 'deploy:testnet';

const NETWORK: string = isTestnet ? 'testnet' : 'mainnet';
const ENDPOINT = `https://${isTestnet ? 'testnet.' : ''}toncenter.com/api/v2/jsonRPC`;

const DATA_PATH = path.resolve(appRoot.path, 'data', 'contract.ts');

const deploy = async () => {
    logger.info('* Deploy');
    logger.info(`  Network: ${NETWORK}`);
    logger.info(`  Endpoint: ${ENDPOINT}`);

    if (!deployConfigCreated) {
        logger.error(`${DEPLOY_CONFIG_DIR} is not exists! start: yarn deploy:config`)
        return process.exit(1);
    }

    const {
        deployerMnemonic,
        apiToken
    } = loadDeployConfig();

    const client = new TonClient({
        endpoint: ENDPOINT,
        apiKey: apiToken
    });

    const newContractFunding = toNano(0.02);
    const workchain = 0;

    const walletKey = await mnemonicToWalletKey(deployerMnemonic.split(' '));
    const walletContract = WalletContract.create(client, WalletV3R2Source.create({ publicKey: walletKey.publicKey, workchain }));

    logger.info(`* Wallet address used to deploy from is: ${walletContract.address.toFriendly()}`)

    const walletBalance = await client.getBalance(walletContract.address);
    logger.info(`* Wallet balance: ${fromNano(walletBalance)} TON`);

    if (walletBalance.lt(newContractFunding)) {
        logger.error(`Wallet has less than ${fromNano(newContractFunding)} TON for gas, please send some TON for gas first`);
        return process.exit(1);
    }

    logger.info('* Find root contracts');

    const rootContracts = await glob.sync(DATA_PATH);
    for (const rootContract of rootContracts) {
        logger.info(`  Found root contract: ${rootContract}`);

        const contractName = path.parse(rootContract).name;

        const deployInitScript = require(path.resolve(appRoot.path, 'data', 'contract'));

        if (typeof deployInitScript.initData !== 'function') {
            logger.error(`${contractName} does not have 'initData()' function`)
            return process.exit(1);
        }

        logger.info(`  + Find ${contractName}#initData()`)
        const initDataCell = deployInitScript.initData() as Cell;

        if (typeof deployInitScript.initMessage !== 'function') {
            logger.error(`${contractName} does not have 'initMessage()' function`)
            return process.exit(1);
        }

        logger.info(`  + Find ${contractName}#initMessage()`)
        const initMessageCell = deployInitScript.initMessage() as Cell | null;

        const hexArtifact = path.resolve(appRoot.path, 'build', `${contractName}.compiled.json`);
        if (!fs.existsSync(hexArtifact)) {
            logger.error(`Build: ${hexArtifact} not found!`)
            return process.exit(1);
        }

        const initCodeCell = Cell.fromBoc(fs.readJSONSync(hexArtifact).hex)[0];

        const newContractAddress = contractAddress({
            workchain,
            initialData: initDataCell,
            initialCode: initCodeCell
        });

        logger.info(`  + New contract address: ${newContractAddress.toFriendly()}`);

        if (await client.isContractDeployed(newContractAddress)) {
            logger.info('  Looks like the contract is already deployed in this address, skipping deployment');
            continue;
        }

        logger.info(`  + Deploy the contract on-chain`);

        const seqno = await walletContract.getSeqNo();

        const transfer = walletContract.createTransfer({
            secretKey: walletKey.secretKey,
            seqno: seqno,
            sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
            order: new InternalMessage({
                to: newContractAddress,
                value: newContractFunding,
                bounce: false,
                body: new CommonMessageInfo({
                    stateInit: new StateInit({ data: initDataCell, code: initCodeCell }),
                    body: initMessageCell !== null ? new CellMessage(initMessageCell) : null
                })
            })
        });

        await client.sendExternalMessage(walletContract, transfer);

        logger.info(`  + Deploy transaction sent successfully`);
        logger.info(`  + Block explorer link: https://${isTestnet ? 'test.' : ''}tonwhales.com/explorer/address/${newContractAddress.toFriendly()}`);

        for (let attempt = 0; attempt < 10; attempt++) {
            await sleep(2000);
            const seqnoAfter = await walletContract.getSeqNo();
            if (seqnoAfter > seqno) break;
        }

        if (await client.isContractDeployed(newContractAddress)) {
            const contractBalance = await client.getBalance(newContractAddress);
            logger.info(`* Contract deployed successfully to address: ${newContractAddress.toFriendly()}`);
            logger.info(`* Contract balance: ${fromNano(contractBalance)} TON`)
        } else {
            logger.error(`Contract address still looks uninitialized: ${newContractAddress.toFriendly()}`);
        }
    }
}

deploy();
