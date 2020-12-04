const MQTT = require('./mqtt');
const logger = require('./util/logger');
const settings = require('./util/settings');

class Controller {
    constructor() {
        this.mqtt = new MQTT();
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
        this.callExtensionMethod('onMQTTMessage', [topic, message]);
    }

    async callExtensionMethod(method, parameters, extensions=null) {
        // console.log(method)
        // console.log(parameters)
        // console.log(extensions)
    }
}

module.exports = Controller;