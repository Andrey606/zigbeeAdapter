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

    onZinaMessage(type, data, resolvedEntity) {
        const obj = JSON.parse(data);

        if(!obj.buffer || !obj.modelId || !obj.clusterId){
            logger.error(`Invalid data '${type}': '${data}'`);
            return;
        }

        let rawData = this.readRawData(obj);
        
        const Device = zigbeeHerdsmanConverters.findByZigbeeModel(rawData.modelId);
        const clusterStruct = ZigbeeHerdsman.Zcl.Utils.getCluster(rawData.clusterId);

        let converter = null;
        Device.fromZigbee.forEach( // перебираем все элементы массива array
            function print( element ) {
                if(element.cluster === clusterStruct.name)
                {
                    converter = element.convert;
                }
            }
        );
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

        const publish = (payload) => {
            this.mqtt.publish(`${settings.get().mqtt.events_topic}/${os.hostname()}`, JSON.stringify(payload));
        }

        const converted = converter(Device, eventData, publish, null, null);

        if (converted) {
            publish(converted);
        }
    }

    onZigbeeEvent(type, data, resolvedEntity) {
        /* do nothing */
    }
}

module.exports = Receive;
