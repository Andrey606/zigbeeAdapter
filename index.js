
const logger = require('./lib/util/logger');
const appVersion = require('./package.json').version;
const engines = require('./package.json').engines;

logger.info(`Starting zigbeeAdapter v${appVersion}`);

const Controller = require('./lib/controller');
const controller = new Controller();
controller.start();

process.on('SIGINT', handleQuit);
process.on('SIGTERM', handleQuit);

let stopping = false;

function handleQuit() {
    if (!stopping) {
        stopping = true;
        controller.stop();
    }
}