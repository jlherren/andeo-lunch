import chalk from 'chalk';
import {AndeoLunch} from '../src/andeoLunch.js';
import {getMainConfig} from '../src/configProvider.js';

/**
 * Main entry point
 */
async function main() {
    console.log(chalk.bold('Starting Andeo Lunch backend...'));

    let mainConfig = await getMainConfig();
    let lm = new AndeoLunch({
        config:  mainConfig,
        logging: true,
    });

    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down');
        lm.close();
    });

    try {
        lm.listen();
        await lm.waitReady();
        console.log(chalk.bold('Server is ready'));
    } catch (err) {
        await lm.close();
        console.error(err);
    }
}

main();
