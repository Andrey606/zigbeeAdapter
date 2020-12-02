console.log('Starting zigbeeAdapter v1.0.0' +'\n');

// #1 input data
const test = {
    cluster: 6,
    attribute: 0,
    data: 0,
    mac: 0x10,
    modelId: 'lumi.plug',
    endpoint: 1
}
console.log('test input data:');
console.log(test);
console.log('\n');

// #2 find device object with modelId
const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');
const device = zigbeeHerdsmanConverters.findByZigbeeModel(test.modelId);
console.log(device);
console.log('\n');

// #3 get commandId 
const ZigbeeHerdsman = require('zigbee-herdsman');
const clusterStruct = ZigbeeHerdsman.Zcl.Utils.getCluster(6)
console.log(clusterStruct);
console.log('\n');
console.log(clusterStruct.name); // 'genOnOff'
console.log('\n');

// #4 find fromZigbee converter 'genOnOff' from device Object
let converter = null;
device.fromZigbee.forEach( // перебираем все элементы массива array
    function print( element ) {
        if(element.cluster === clusterStruct.name)
        {
            console.log(element);
            console.log('\n');
            converter = element.convert;
        }
    }
);

// #5 используем нужный метод конвертера и заганяем в него нужные значения
/**
 * Documentation of convert() parameters
 * - model: zigbee-herdsman-converters definition (form devices.js)
 * - msg: message data property
 * - publish: publish method
 * - options: converter options object, e.g. {occupancy_timeout: 120}
 * - meta: object containing {device: (zigbee-herdsman device object)}
 */
let payload = {};

// model
const model = device;
// publish
const publish = (payload) => {
    console.log('publish: ' + payload + "!!!");
    console.log('\n');
}
// resolvedEntity
//const Zigbee = require('zigbee2mqtt/lib/zigbee');
//let zigbee = new Zigbee();
const Controller = require('zigbee2mqtt/lib/controller');
const controller = new Controller();
// data
// 1) нужно заполнить структуру dataPayload
const device = typeof dataPayload.address === 'string' ?
                model_1.Device.byIeeeAddr(dataPayload.address) : model_1.Device.byNetworkAddress(dataPayload.address);
// 2) заполнить eventData который и является data
const eventData = {
    //type: type, device, endpoint, data, linkquality, groupID, cluster: clusterName, meta
};



//controller.onZigbeeEvent('message', );

//const resolvedEntity = zigbee.resolveEntity(data.device || data.ieeeAddr);
// где берется data? => zclData -> ZclFrame структура, кроме них еще бывает rawData ...
/* to do */

// const converted =  converter(null, null);





console.log(payload); // {state: 'OFF'}
console.log('\n');

const responseFrame = ZigbeeHerdsman.Zcl.ZclFrame.create(
    ZigbeeHerdsman.Zcl.FrameType.GLOBAL, 
    ZigbeeHerdsman.Zcl.Direction.SERVER_TO_CLIENT, 
    true, 
    null, 
    100, 
    'readRsp', 
    6, 
    [{attrId: 0, attrData: 0, dataType: 16, status: 0}]
);
console.log(responseFrame);




const mockAdapterEvents = {};




mockAdapterEvents['zclData'] = {
    address: 129,
    frame: ZigbeeHerdsman.Zcl.ZclFrame.create(0, 0, true, null, 40, 0, 10, [{attrId: 0}, {attrId: 1}, {attrId: 7}, {attrId: 9}]),
    endpoint: 1,
    linkquality: 19,
    groupID: 10,
};
console.log(mockAdapterEvents);










// get data about some cluster from ZigbeeHerdsman
//let onOffCluster = ZigbeeHerdsman.Zcl.Utils.getCluster(6)
//console.log(onOffCluster)

// zigbeeHerdsmanConverters 
// get genLevelCtrl data
//console.log(zigbeeHerdsmanConverters.devices)
//console.log(zigbeeHerdsmanConverters.devices[0])
//console.log(zigbeeHerdsmanConverters.devices[0].fromZigbee[0].cluster) 
//console.log(zigbeeHerdsmanConverters.devices[0].fromZigbee[0].cluster) 
//let converterLevelCtr = zigbeeHerdsmanConverters.devices[0].fromZigbee[0].convert
//console.log(converterLevelCtr)
//let msg
//console.log(converterLevelCtr("testModel", msg))



//const ExtensionReceive = require('zigbee2mqtt/lib/extension/receive');
//const recieve = new ExtensionReceive();

//console.log(recieve)

