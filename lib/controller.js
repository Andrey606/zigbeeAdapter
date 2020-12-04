const MQTT = require('./mqtt');
const logger = require('./util/logger');
const settings = require('./util/settings');
const EventBus = require('./eventBus');
const data = require('./util/data');
const fs = require('fs');
var os = require("os");

// Extensions
const ExtensionReceive = require('./extension/receive');

const AllExtensions = [
    ExtensionReceive,
];

class Controller {
    constructor() {
        this.mqtt = new MQTT();
        this.eventBus = new EventBus();

        // Initialize extensions.
        const args = [null, this.mqtt, null, null, this.eventBus];

        this.extensions = [
            new ExtensionReceive(...args),
        ];

        if (settings.get().experimental.new_api) {
            this.extensions.push(new ExtensionBridge(...args, this.enableDisableExtension));
        }

        if (settings.get().frontend) {
            this.extensions.push(new ExtensionFrontend(...args));
        }

        if (settings.get().homeassistant) {
            this.extensions.push(new ExtensionHomeAssistant(...args));
        }

        /* istanbul ignore next */
        if (settings.get().advanced.soft_reset_timeout !== 0) {
            this.extensions.push(new ExtensionSoftReset(...args));
        }

        if (settings.get().advanced.availability_timeout) {
            this.extensions.push(new ExtensionAvailability(...args));
        }
        if (settings.get().external_converters.length) {
            this.extensions.push(new ExtensionExternalConverters(...args));
        }

        const extensionPath = data.joinPath('extension');
        if (fs.existsSync(extensionPath)) {
            const extensions = fs.readdirSync(extensionPath).filter((f) => f.endsWith('.js'));
            for (const extension of extensions) {
                const Extension = require(path.join(extensionPath, extension.split('.')[0]));
                this.extensions.push(new Extension(...args, settings, logger));
            }
        }
    }

    async start() {
        // MQTT
        this.mqtt.on('message', this.onMQTTMessage.bind(this));
        await this.mqtt.connect();

        // // Call extensions
        await this.callExtensionMethod('onMQTTConnected', []);
    }

    async enableDisableExtension(enable, name) {
        if (!enable) {
            const extension = this.extensions.find((e) => e.constructor.name === name);
            if (extension) {
                await this.callExtensionMethod('stop', [], [extension]);
                this.extensions.splice(this.extensions.indexOf(extension), 1);
            }
        } else {
            const Extension = AllExtensions.find((e) => e.name === name);
            assert(Extension, `Extension '${name}' does not exist`);
            const extension = new Extension(this.zigbee, this.mqtt, this.state, this.publishEntityState, this.eventBus);
            this.extensions.push(extension);
            this.callExtensionMethod('onZigbeeStarted', [], [extension]);
            this.callExtensionMethod('onMQTTConnected', [], [extension]);
        }
    }

    async stop() {
        // Call extensions
        await this.callExtensionMethod('stop', []);

        // Wrap-up
        await this.mqtt.disconnect();

        try {
            process.exit(0);
        } catch (error) {
            process.exit(1);
        }
    }

    onMQTTMessage(payload) {
        const {topic, message} = payload;
        logger.info(`Received MQTT message on '${topic}' with data '${message}'`);
        
        // Call extensions
        if(topic === `${settings.get().mqtt.commands_topic}/${os.hostname()}`)
        {
            this.callExtensionMethod('onZinaMessage', [topic, message]);
        }
        else
        {
            this.callExtensionMethod('onMQTTMessage', [topic, message]);
        }
    }

    async callExtensionMethod(method, parameters, extensions=null) {
        for (const extension of extensions || this.extensions) {
            if (extension[method]) {
                try {
                    await extension[method](...parameters);
                } catch (error) {
                    /* istanbul ignore next */
                    logger.error(`Failed to call '${extension.constructor.name}' '${method}' (${error.stack})`);
                    /* istanbul ignore next */
                    if (process.env.JEST_WORKER_ID !== undefined) {
                        throw error;
                    }
                }
            }
        }
    }
}

module.exports = Controller;