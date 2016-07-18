var mongoose = require('mongoose');
var request = require('request');
var device = require('../models/device');
var constants = require('../constants/constants.json');


exports.listDevices = function(callback) { 

	device.find( {}, {_id : false,__v : false }, function(err,devices){

		if(!err){

			callback(devices)
		
		}
	});
}
exports.searchDevices = function(deviceId,callback) {
    device.find({
        deviceId: { $in: deviceId}
        //platform: { $eq: "A"}
    }, function (err, docs) {
        if(err){
            return callback(err);
        }
        else{
            return callback(null,docs);
        }

    });
};