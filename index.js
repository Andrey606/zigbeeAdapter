const ZigbeeHerdsman = require('zigbee-herdsman');
const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');

console.log('Starting zigbeeAdapter v1.0.0' +'\n');


// get data about some cluster from ZigbeeHerdsman
let onOffCluster = ZigbeeHerdsman.Zcl.Utils.getCluster(6)
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



const ExtensionReceive = require('zigbee2mqtt/lib/extension/receive');
const recieve = new ExtensionReceive();

console.log(recieve)