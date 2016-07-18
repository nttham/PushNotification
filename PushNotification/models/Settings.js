

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SettingsSchema = new Schema({
    gcmApiKey		: String,
    apnsPassword	: String,
    apnsCertificate	: String,
    instanceID      : String
});

module.exports = mongoose.model('Settings', SettingsSchema);