var apn = require('apn');
var path = require('path');
var constants = require('../constants/constants.json');
var gcm = require('node-gcm');

exports.sendAPNSMessage = function(message,deviceToken,settings,options){

	try {
        console.log("options *********** for APNS "+JSON.stringify(options));
        options.production = true;

        //Prepare the connection with options
		var connection = new apn.Connection(options);
        //Create the notification settings like expiry , badge, payload , sound
		var note = new apn.Notification();

        // Notification Expires 1 hour from now.
		note.expiry = Math.floor(Date.now() / 1000) + 3600;

        //message to be sent in notification
		note.alert = message;

        //Fetch all settings info if present
		if(settings && settings.badge) {
			note.badge = settings.badge;
		}

		if(settings && settings.sound) {
			note.sound = settings.sound;
		}

		if(settings && settings.payload) {
			note.payload = settings.payload;
		}


        //Send the notification to all device tokens fetched
		connection.pushNotification(note, deviceToken);

        // A submission action has completed. This just means the message was submitted, not actually delivered.
		connection.on('completed', function(a) {
			console.log('APNS: Completed sending push notification');
		});

		// A message has been transmitted.
		connection.on('transmitted', function(notification, device) {
			console.log('APNS: Successfully transmitted message to '+device);
		});

		// There was a problem sending a message.
		connection.on('transmissionError', function(errorCode, notification, device) {
			var deviceToken = device.toString('hex').toUpperCase();

			if (errorCode === 8) {
				console.log('APNS: Transmission error -- invalid token', errorCode, deviceToken);
				//callback(constants.error.msg_send_failure);
				// Do something with deviceToken here - delete it from the database?
			} else {
				console.error('APNS: Transmission error', errorCode, deviceToken);
			}
		});

		connection.on('connected', function() {
			console.log('APNS: Connected');
		});

		connection.on('timeout', function() {
			console.error('APNS: Connection timeout');
		});

		connection.on('disconnected', function() {
			console.error('APNS: Lost connection');
		});

		connection.on('socketError', console.log);

	}
	catch (ex) {
		console.log("ERROR Exception :"+ex);
	}


};


exports.notifyGCMDevices = function(message,registrationId,gcmMessage,gcmKey){

    var message = new gcm.Message({data: {message: message}});

    // Adding payload for the Notification

    if(typeof gcmMessage != 'undefined') {
        message.addNotification(gcmMessage);
    }


    var regTokens = registrationId;

    var sender = new gcm.Sender(gcmKey);
    console.log("regTokens : "+regTokens);
    // Set up the sender with you API key, prepare your recipients' registration tokens.
    sender.send(message, { registrationTokens: regTokens }, function (err, response) {
        if (err){
            console.error("error ********************************** "+err);
            return;
        } else 	{
            console.log("response ************************** "+JSON.stringify(response));
            return;
        }
    });
};
