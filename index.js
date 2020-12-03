console.log('Starting zigbeeAdapter v1.0.0' +'\n');

// #1 input data
// state on
let test1 = {
    type: 'zcl',
    cluster: 6,
    attribute: 0,
    data: 1,
    dataType: 16,
    mac: null,
    short: null,
    modelId: 'lumi.plug',
    endpoint: 1
}
// power 0
let test2 = {
    type: 'zcl',
    cluster: 12,
    attribute: 85,
    data: 0,
    dataType: 57,
    mac: null,
    short: null,
    modelId: 'lumi.plug',
    endpoint: 1
}

// zcl {state: 'ON', power: 0, consumption: 0, energy: 0, temperature: 34, voltage: 217}
let test3 = {
    type: 'zcl',
    cluster: 0,
    attribute: 65281,
    data: {3: 34, 5: 8, 7: '0x0000000000000000', 8: 4886, 9: 256, 100: 1, 149: 0.0004483360389713198, 150: 2170, 152: 0, 154: 0},
    dataType: 66,
    mac: null,
    short: null,
    modelId: 'lumi.plug',
    endpoint: 1
}

// raw {state: 'OFF'}
let test4 = {
    type: 'raw',
    cluster: 6,
    data: [24, 212, 10, 0, 0, 16, 0, 0, 240, 35, 0, 7, 47, 3],
    mac: null,
    short: null,
    modelId: 'lumi.plug',
    endpoint: 1
}

// raw {state: 'ON'}
let test5 = {
    type: 'raw',
    cluster: 6,
    data: [24, 77, 10, 0, 0, 16, 1, 0, 240, 35, 0, 7, 47, 3],
    mac: null,
    short: null,
    modelId: 'lumi.plug',
    endpoint: 1
}

// raw {state: 'ON', power: 0, consumption: 0, energy: 0, temperature: 34, voltage: 217}
let test6 = {
    type: 'raw',
    cluster: 0,
    data: [28, 95, 17, 10, 10, 1, 255, 66, 49, 100, 16, 1, 3, 40, 25, 152, 57, 0, 0, 0, 0, 149, 57, 101, 19, 235, 57, 150, 35, 192, 8, 0, 0, 5, 33, 10, 0, 154, 32, 16, 8, 33, 22, 19, 7, 39, 0, 0, 0, 0, 0, 0, 0, 0, 9, 33, 0, 1],
    mac: null,
    short: null,
    modelId: 'lumi.plug',
    endpoint: 1
}

const test = test6;
// console.log('test input data:');
// console.log(test);
// console.log('\n');

// #2 find device object with modelId
const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');
const Device = zigbeeHerdsmanConverters.findByZigbeeModel(test.modelId);
// console.log(Device);
// console.log('\n');

// #3 get commandId 
const ZigbeeHerdsman = require('zigbee-herdsman');
const clusterStruct = ZigbeeHerdsman.Zcl.Utils.getCluster(test.cluster)
// console.log(clusterStruct);
// console.log('\n');
// console.log(clusterStruct.name); // 'genOnOff'
// console.log('\n');

// #4 find fromZigbee converter 'genOnOff' from Device Object
let converter = null;
Device.fromZigbee.forEach( // перебираем все элементы массива array
    function print( element ) {
        if(element.cluster === clusterStruct.name)
        {
            // console.log(element);
            // console.log('\n');
            converter = element.convert;
        }
    }
);

// #5 имитация входных данных для onZclOrRawData(dataType, dataPayload) {....}
const dataType = test.type;
let dataPayload = {
    frame: null,
    address: null,
    endpoint: null,
    linkquality: null,
    groupID: null
}; // {frame: ZclFrame, address: 12039, endpoint: 2, linkquality: 115, groupID: 0}
dataPayload.address = test.short;
dataPayload.endpoint = test.endpoint;
dataPayload.linkquality = 100;
dataPayload.groupID = 0;

// #5.1 нужно достать норм ZclFrame
let responseFrame = null;
if(dataType === 'zcl')
{
    responseFrame = ZigbeeHerdsman.Zcl.ZclFrame.create(
        ZigbeeHerdsman.Zcl.FrameType.GLOBAL, 
        ZigbeeHerdsman.Zcl.Direction.SERVER_TO_CLIENT, 
        true, 
        null, 
        100, 
        'readRsp', 
        test.cluster, 
        [{attrId: test.attribute, attrData: test.data, dataType: test.dataType}/*, {attrId: 61440, dataType: 35, attrData: 53413632}*/]
    );
}
else if(dataType === 'raw')
{
    responseFrame = ZigbeeHerdsman.Zcl.ZclFrame.fromBuffer(test.cluster, Buffer(test.data));
}
else
{
    return;
}

// console.log(responseFrame);
dataPayload.frame = responseFrame;

// #6 имитация входных данных для async onZigbeeEvent(type, data) { }
const type = 'message';
let eventData = {}; // const eventData = {type: type, device, endpoint, data, linkquality, groupID, cluster: clusterName, meta}
eventData['type'] = 'attributeReport';
eventData['endpoint'] = dataPayload.endpoint;
eventData['linkquality'] = dataPayload.linkquality;
eventData['groupID'] = dataPayload.groupID;
eventData['cluster'] = clusterStruct.name;

// #6.2 дабор meta и data
let data;
const meta = {};
const frame = dataPayload.frame;
meta.zclTransactionSequenceNumber = frame.Header.transactionSequenceNumber;
meta.manufacturerCode = frame.Header.manufacturerCode;
meta.frameControl = frame.Header.frameControl;
eventData['meta'] = meta;
// console.log(meta);

const ZigbeeHerdsmanHelper = require('zigbee-herdsman/dist/controller/helpers');
data = ZigbeeHerdsmanHelper.ZclFrameConverter.attributeKeyValue(dataPayload.frame);
eventData['data'] = data;
// console.log(data);

// #7 имитация входных данных для async this.callExtensionMethod('onZigbeeEvent', [type, data, resolvedEntity]);
type;
let Data = eventData;
const resolvedEntity = {
    definition: Device,
    settings: null
};
const Meta = null;

// #8 имитация даных для конвертера
const publish = (payload) => {
}


// #9 вызов ковертера
const converted = converter(resolvedEntity.definition, Data, publish, resolvedEntity.settings, Meta);
// console.log(converted); // undefined - если не отпарсило


const Controller = require('./lib/controller');
const controller = new Controller();
controller.start();
















































 
// #5 используем нужный метод конвертера и заганяем в него нужные значения
/**
 * Documentation of convert() parameters
 * - model: zigbee-herdsman-converters definition (form devices.js)
 * - msg: message data property
 * - publish: publish method
 * - options: converter options object, e.g. {occupancy_timeout: 120}
 * - meta: object containing {device: (zigbee-herdsman device object)}
 */

//const Zigbee = require('zigbee2mqtt/lib/zigbee');
//let zigbee = new Zigbee();
// const Controller = require('zigbee2mqtt/lib/controller');
// const controller = new Controller();
// // data
// // 1) нужно заполнить структуру dataPayload
// // const device = typeof dataPayload.address === 'string' ?
// //                 model_1.Device.byIeeeAddr(dataPayload.address) : model_1.Device.byNetworkAddress(dataPayload.address);
// // 2) заполнить eventData который и является data
// const eventData = {
//     //type: type, device, endpoint, data, linkquality, groupID, cluster: clusterName, meta
// };



// //controller.onZigbeeEvent('message', );

// //const resolvedEntity = zigbee.resolveEntity(data.device || data.ieeeAddr);
// // где берется data? => zclData -> ZclFrame структура, кроме них еще бывает rawData ...
// /* to do */

// // const converted =  converter(null, null);





// console.log(payload); // {state: 'OFF'}
// console.log('\n');

// const responseFrame = ZigbeeHerdsman.Zcl.ZclFrame.create(
//     ZigbeeHerdsman.Zcl.FrameType.GLOBAL, 
//     ZigbeeHerdsman.Zcl.Direction.SERVER_TO_CLIENT, 
//     true, 
//     null, 
//     100, 
//     'readRsp', 
//     6, 
//     [{attrId: 0, attrData: 0, dataType: 16, status: 0}]
// );
// console.log(responseFrame);




// const mockAdapterEvents = {};




// mockAdapterEvents['zclData'] = {
//     address: 129,
//     frame: ZigbeeHerdsman.Zcl.ZclFrame.create(0, 0, true, null, 40, 0, 10, [{attrId: 0}, {attrId: 1}, {attrId: 7}, {attrId: 9}]),
//     endpoint: 1,
//     linkquality: 19,
//     groupID: 10,
// };
// console.log(mockAdapterEvents);










// // get data about some cluster from ZigbeeHerdsman
// //let onOffCluster = ZigbeeHerdsman.Zcl.Utils.getCluster(6)
// //console.log(onOffCluster)

// // zigbeeHerdsmanConverters 
// // get genLevelCtrl data
// //console.log(zigbeeHerdsmanConverters.devices)
// //console.log(zigbeeHerdsmanConverters.devices[0])
// //console.log(zigbeeHerdsmanConverters.devices[0].fromZigbee[0].cluster) 
// //console.log(zigbeeHerdsmanConverters.devices[0].fromZigbee[0].cluster) 
// //let converterLevelCtr = zigbeeHerdsmanConverters.devices[0].fromZigbee[0].convert
// //console.log(converterLevelCtr)
// //let msg
// //console.log(converterLevelCtr("testModel", msg))



// //const ExtensionReceive = require('zigbee2mqtt/lib/extension/receive');
// //const recieve = new ExtensionReceive();

// //console.log(recieve)

