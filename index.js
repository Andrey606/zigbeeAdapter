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

