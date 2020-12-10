const settings = require('../util/settings');
const logger = require('../util/logger');
const utils = require('../util/utils');
const debounce = require('debounce');
const Extension = require('./extension');
const stringify = require('json-stable-stringify-without-jsonify');
const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');
const ZigbeeHerdsman = require('zigbee-herdsman');
const ZigbeeHerdsmanHelper = require('zigbee-herdsman/dist/controller/helpers');
var os = require("os");

class Receive extends Extension {
    constructor(zigbee, mqtt, state, publishEntityState, eventBus) {
        super(zigbee, mqtt, state, publishEntityState, eventBus);
    }

    readRawData(data){
        let tmpStr = String('185d0a').concat('', data.buffer.slice(2));
        let tmpRawData = {
            modelId: data.modelId, 
            clusterId: parseInt(data.clusterId, 16),
            buffer: Buffer.from(tmpStr, 'hex')
        };
        return tmpRawData;
    }

    readMqttKeys(data){
        let tmp = [];
        for (var key in data) {
            tmp.push({key: key, value: data[key]});
        }
        return tmp;
    }

    onZinaMessageZigbee2mqtt(type, json, resolvedEntity)
    {
        if(!json.buffer || !json.modelId || !json.clusterId){
            logger.error(`Invalid data '${type}': '${data}'`);
            return;
        }

        let rawData = this.readRawData(json);
        
        const Device = zigbeeHerdsmanConverters.findByZigbeeModel(rawData.modelId);
        const clusterStruct = ZigbeeHerdsman.Zcl.Utils.getCluster(rawData.clusterId);

        let converters = [];
        Device.fromZigbee.forEach( // перебираем все элементы массива array
            function print( element ) {
                if(element.cluster === clusterStruct.name)
                {
                    converters.push(element.convert);
                }
            }
        );
        //console.log(converters);

        // Check if there is an available converter, genOta messages are not interesting.
        if (!converters.length || clusterStruct.name === 'genOta' || clusterStruct.name === 'genTime') {
            logger.debug(
                `No converter available for '${Device.model}' with cluster '${clusterStruct.name}' ` +
                ` and data '${stringify(rawData.buffer)}'`,
            );
            return;
        }

        let responseFrame = ZigbeeHerdsman.Zcl.ZclFrame.fromBuffer(rawData.clusterId, rawData.buffer);
        let dataPayload = {
            frame: responseFrame,
            address: null,
            endpoint: null,
            linkquality: null,
            groupID: null
        };
        let eventData = {}; // const eventData = {type: type, device, endpoint, data, linkquality, groupID, cluster: clusterName, meta}
        eventData['type'] = 'attributeReport';
        eventData['endpoint'] = dataPayload.endpoint;
        eventData['linkquality'] = dataPayload.linkquality;
        eventData['groupID'] = dataPayload.groupID;
        eventData['cluster'] = clusterStruct.name;
        eventData['data']  = ZigbeeHerdsmanHelper.ZclFrameConverter.attributeKeyValue(dataPayload.frame);
        //console.log(eventData['data']);
        const publish = (payload) => {
            this.mqtt.publish(`${settings.get().mqtt.events_topic}/${os.hostname()}`, JSON.stringify(payload));
        }

        let converted = null;
        let payload = {};
        converters.forEach((converter) => {
            const converted = converter(Device, eventData, publish, null, null);
            if (converted) {
                payload = {...payload, ...converted};
            }
        });

        if (Object.keys(payload).length) {
            publish(payload);
        }
    }

    onZinaMessageMqtt2zigbee(type, json, resolvedEntity)
    {
        if(!json.desired || !json.modelId){
            logger.error(`Invalid data '${type}': '${data}'`);
            return;
        }

        logger.info(json.modelId);

        let keys = this.readMqttKeys(json.desired);
        for (let index = 0; index < keys.length; index++) {
            const element = keys[index];
            // logger.info(element.key);
            // logger.info(element.value);
        }

        const Device = zigbeeHerdsmanConverters.findByZigbeeModel(json.modelId);

        let converters = [];
        Device.toZigbee.forEach( // перебираем все элементы массива array
            function print( element ) {
                for (let index = 0; index < keys.length; index++) {
                    const tmp = keys[index];
                    if(element.key == tmp.key)
                    {
                        converters.push(element);
                    }
                }
            }
        );
        console.log(converters);

        const meta = {
            endpoint_name: '',
            options: null,
            message: json.desired,
            logger: null,
            device: null,
            state: null,
            membersState: null,
            mapped: Device,
        };

        console.log(ZigbeeHerdsman)

        actualTarget = null;

        converters.convertSet(actualTarget, keys[0].key. keys[0].value, meta);
    }

    onZinaMessage(type, data, resolvedEntity) {
        const obj = JSON.parse(data);

        if(obj.clusterId){
            this.onZinaMessageZigbee2mqtt(type, obj, resolvedEntity);
        }
        else if(obj.desired){
            this.onZinaMessageMqtt2zigbee(type, obj, resolvedEntity);
        }
        else{
            logger.error(`Invalid data '${type}': '${data}'`);
            return;
        }
    }

    onZigbeeEvent(type, data, resolvedEntity) {
        /* do nothing */
    }
}

module.exports = Receive;
