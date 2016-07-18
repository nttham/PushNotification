var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DeviceSchema = new Schema({
    deviceId		: String,
    userId			: String,
    deviceToken		: String,
    platform		: String,
    createdTime		: Date,
    lastUpdatedTime	: Date,
    createdMode		: String
});

module.exports = mongoose.model('Device', DeviceSchema);
