var constants = require('../constants/constants.json');
var registerFunction = require('../functions/register');
var devicesFunction = require('../functions/devices');
var deleteFunction = require('../functions/delete');
var sendFunction = require('../functions/send-message');
var updateFunction = require('../functions/update');
var getTokens = require('../functions/getTokens');
var settingsModel =  require('../models/Settings.js');
var mongoose = require('mongoose');
var device = require('../models/device');
var connector = require('./Connector.js')
var multer = require('multer'),
    path = require('path');
var fs = require('fs');

var async = require("async");

module.exports = function(app,io) {

    //TODO :: Remove this during production. Sample UI to check device info
    io.on('connection', function(socket){

        console.log("Client Connected");
        socket.emit('update', { message: 'Hello Client',update:false });

        socket.on('update', function(msg){

            console.log(msg);
        });
    });

    // Delete the DB connection before the response is sendBack
    var afterResponse = function(db) {
        console.log('Mongoose afterResponse');
        // any other clean ups
        db.close(function () {
            console.log('Mongoose connection disconnected');
        });

    }

    //This route will show the sample UI
    app.get('/',function(req,res) {

        res.sendFile('index.html');

    });

    //Registering the devices.
    //This needs deviceId, deviceToken, Platform as mandatory inputs
    //On response if device already exists return error else return success

    app.post('/devices',function(req,res) {

        var deviceId   = req.body.deviceId;
        var deviceToken = req.body.deviceToken;
        var platform = req.body.platform.toUpperCase();
        var createdMode = "API";
        var userId = "";

        //var dbname = req.headers.apiSecret;

        //TODO :: Add the apiSecret check on the headers part for security
        //Check for mandatory parameters and also check if they are not null values


        if ( typeof deviceId == 'undefined' || typeof deviceToken  == 'undefined' || typeof platform  == 'undefined') {


            res.json(constants.error.msg_invalid_param);

        } else if ( !deviceId.trim() || !deviceToken|| !platform.trim() ) {

            res.json(constants.error.msg_empty_param);

        } else if ( platform === "APNS" || platform === "GCM" || platform === "WNS") {


            if(req.body.createdMode) {
                createdMode = req.body.createdMode;
            }

            if(req.body.userId) {
                createdMode = req.body.userId;
            }
            //TODO :: pass the dynamic DB instanceName created in dbName

            var dbName = "push12";

            //This method will create a DB connection with db name as dbName
            connector.connectToMongo(dbName,function(err,dbInstance) {

                //Register device. Storing into db
                registerFunction.register( userId,deviceId,deviceToken,platform,createdMode, function(result) {
                    //deleting the DB connection before responding to the client
                    afterResponse(dbInstance.dbConnection);

                    res.json(result);

                    //TODO :: Remove this notify to sample UI during production
                    if (result.result != 'error'){

                        io.emit('update', { message: 'New Device Added',update:true});

                    }
                });
            });
        } else {
            //Return error for invalid params
            console.log(constants.error.msg_invalid_param.message);
            res.status(constants.error.msg_invalid_param.code).send(constants.error.msg_invalid_param.message);
        }
    });//end of post method /devices

    //Return all the registered devices from db
    app.get('/devices',function(req,res) {

        //TODO :: pass the dynamic DB instanceName created in dbName
        var dbName = "push12";

        //This method will create a DB connection with db name as dbName
        connector.connectToMongo(dbName,function(err,dbInstance) {
            devicesFunction.listDevices(function(result) {
                //deleting the DB connection before responding to the client
                afterResponse(dbInstance.dbConnection);
                res.json(result);

            });
        });
    });


    //Updating the device details.
    //Take the deviceId as path param. UserId,deviceToken, platform are the available fields to update for a selected deviceId

    app.put('/devices/:device',function(req,res) {
        //TODO :: Check if deviceid(device) is present
        var deviceId = req.params.device;

        var deviceDetails = {
            userId : req.body.userId,
            deviceToken : req.body.deviceToken,
            platform : req.body.platform
        }

        if ( typeof deviceId  == 'undefined') {

            console.log(constants.error.msg_invalid_param.message);

            res.json(constants.error.msg_invalid_param);

        }
        else if (typeof deviceDetails.userId == 'undefined' && typeof deviceDetails.deviceToken  == 'undefined' && typeof deviceDetails.platform  == 'undefined') {
            console.log(constants.error.msg_invalid_param.message);
            res.json(constants.error.msg_invalid_param);
        }
        else {
            //TODO :: pass the dynamic DB instanceName created in dbName
            var dbName = "push12";

            //This method will create a DB connection with db name as dbName
            connector.connectToMongo(dbName,function(err,dbInstance) {

                updateFunction.updateDevice(deviceId,deviceDetails,function(result) {
                    //deleting the DB connection before responding to the client
                    afterResponse(dbInstance.dbConnection);
                    res.json(result);
                });

            });
        }

    });

    app.delete('/devices/:device',function(req,res) {

        //TODO :: Check if deviceid(device) is present

        var deviceId = req.params.device;

        //TODO :: pass the dynamic DB instanceName created in dbName
        var dbName = "push12";

        //This method will create a DB connection with db name as dbName
        connector.connectToMongo(dbName,function(err,dbInstance) {
            deleteFunction.removeDevice(deviceId, function (result) {
                //deleting the DB connection before responding to the client
                afterResponse(dbInstance.dbConnection);
                res.json(result);

            });
        });
    });


    app.post('/notify',function(req,res){
        console.log("request came ******** "+JSON.stringify(req.body));
        var message = req.body.message;
        //var deviceToken = req.body.deviceToken;
        var deviceId = req.body.deviceId;

        if ( typeof message  == 'undefined' || typeof deviceId == 'undefined') {
            console.log(constants.error.msg_invalid_param.message);
            res.json(constants.error.msg_invalid_param);
        }

        else {

            //TODO :: pass the dynamic DB instanceName created in dbName
            var dbName = "push12";

            //This method will create a DB connection with db name as dbName
                connector.connectToMongo(dbName,function(err,dbInstance) {

                //This Api Will fetch the device info with the deviceId
                var searchDevices = function(callback){

                    var Devices = require('../functions/devices.js');
                    Devices.searchDevices(deviceId,callback);
                };//end of searchDevices()

                //This Api Will fetch all the deviceTokens for APNS ,GCM and WNS
                var getTokenForAll = function(docs,callback){
                    console.log("searchDevices   ",docs)
                    if(docs.length){

                        getTokens.getTokens(docs,function(tokens) {
                            var Devices = {};
                            Devices.apnsDevices=tokens.apnsDevices;
                            Devices.gcmDevices=tokens.gcmDevices;
                            Devices.wnsDevices=tokens.wnsDevices;
                            console.log("searchDevices  Devices ",JSON.stringify(Devices));
                            return callback(null,Devices);
                        });

                    }
                    else{
                        return callback({"error":"No devices found"});
                    }

                };//end of getTokenForAll()

                //This Api Will send message for respective devices viz APNS ,GCM and WNS
                var sendMessage = function(device,callback){
                    //This Api Will send message for APNS
                    var notifyAPNS = function(callback){

                        //Check if any device tokens found. If not throw log it in logger
                        if(device.apnsDevices.length){
                            var apnsSettings;

                            if(req.body.settings && req.body.settings.apns) {
                                apnsSettings = req.body.settings.apns;

                            }

                            var settings = require('../functions/Settings.js');

                            var onSettings = function(err,settingsObj){

                                if(!err){
                                    //Check if any settings info found
                                    if(settingsObj.length && settingsObj[0].apnsCertificate && settingsObj[0].apnsPassword){
                                        var ApnsCertificate  = require('../functions/ApnsCertificate');

                                        //fetch the Apns Certificate with the fileName and dbInstance as input
                                        ApnsCertificate.getCertificate (settingsObj[0].apnsCertificate,dbInstance,function(err,options){
                                            if (err) {
                                                console.log("error      "+err);
                                                return callback(null,true);
                                            }
                                            else{

                                                options.passphrase = settingsObj[0].apnsPassword;

                                                //Call function to send push notification APNS
                                                sendFunction.sendAPNSMessage(message, device.apnsDevices, apnsSettings, options);
                                                return callback(null,true);

                                            }
                                        });


                                    }
                                    else{
                                        console.log("No Settings available for this device  ");
                                        return callback(null,true);
                                    }


                                }
                                else{
                                    console.log("error onSettings "+err);
                                    return callback(null,true);
                                }

                            };
                            //fetch the settings info for the given instanceId
                            settings.getSettings(req.body.instanceId,onSettings);


                        }
                        else{
                            console.log("No Devices Available");
                            return callback(null,true);
                        }

                    };//end of notifyAPNS()


                    //This Api Will send message for GCM
                    var notifyGCM = function(obj,callback){

                        //Check if any device tokens found. If not throw log it in logger
                        if(device.gcmDevices.length) {

                            var gcmSettings;
                            if(req.body.settings) {
                                if(req.body.settings.gcm) {
                                    gcmSettings = req.body.settings.gcm;
                                }
                            }
                            var settings = require('../functions/Settings.js');
                            var gcmKey ;

                            //Check if any settings info found
                            var onSettings =function(err,settingsObj) {
                                if(!err){
                                    if (settingsObj.length && settingsObj[0].gcmApiKey ) {
                                        gcmKey = settingsObj[0].gcmApiKey;
                                        //Call function to send push notification GCM
                                        sendFunction.notifyGCMDevices(message, device.gcmDevices,gcmSettings, gcmKey);
                                        return callback(null, device);
                                    }
                                    else{
                                        console.log("No Settings available for this device  ");
                                        return callback(null,true);

                                    }

                                }
                                else{
                                    console.log("error onSettings "+err);
                                }     return callback(null,true);

                            };
                            //fetch the settings info for the given instanceId
                            settings.getSettings(req.body.instanceId,onSettings);

                        }else{
                            console.log("No Devices Found for GCM ");
                            return callback(null,device);
                        }

                    }; //end of notifyGCM


                    //This Api Will send message for GCM
                    var notifyWNS = function(obj,callback){

                        //Check if any device tokens found. If not throw log it in logger
                        if(device.wnsDevices.length) {

                            var wnsSettings;
                            if(req.body.settings) {
                                if(req.body.settings.wns) {
                                    wnsSettings = req.body.settings.wns;
                                }
                            }

                            //Check if any settings info found
                            var onSettings =function(err,settingsObj) {
                                if(!err){
                                    //TODO :: pass the required configuration needed for WNS in payload
                                    if (settingsObj.length && settingsObj[0].XXXXX ) {

                                        //Call function to send push notification WNS

                                        //TODO :: pass the required configuration needed for WNS in payload
                                        sendFunction.sendWNSMessage(message,wnsDevices,wnsSettings,payload);
                                        return callback(null,true);

                                    }
                                    else{
                                        console.log("No Settings available for this device  ");
                                        return callback(null,true);

                                    }

                                }
                                else{
                                    console.log("error onSettings "+err);
                                }     return callback(null,true);

                            };
                            //fetch the settings info for the given instanceId
                            settings.getSettings(req.body.instanceId,onSettings);

                        }
                        else{
                            console.log("errorNo devices found for WNS");
                            return callback(null,true);
                        }

                    };

                    var waterfallCallback = function(err,results){
                        console.log("Message Send Successfully ********** ");
                        return callback(null,true);
                    }

                    // Here the control flow for sending message is in series
                    async.waterfall([notifyAPNS,notifyGCM,notifyWNS],waterfallCallback);


                }; //end of sendMessage


                var finalCallback= function(err,result){
                    afterResponse(dbInstance.dbConnection);
                    if (err) {

                        res.json(err);
                        res.status(400).end();

                    }
                    else {

                        res.status(202).send('Accepted to send Push Notification');

                    }
                };
                // Here the control flow for sending message is in series
                async.waterfall([searchDevices,getTokenForAll,sendMessage],finalCallback);

            });
        }
    });


    app.get('/fileUpload',function(req,res) {

        res.render('index');

    });

    app.post('/upload', multer({ dest: './uploads/'}).single('upl'), function(req,res) {

        console.log("req file " + JSON.stringify(req.file));
        try{
            //TODO :: pass the dynamic DB instanceName created in dbName
            var dbName = "push12";

            //This method will create a DB connection with db name as dbName
            connector.connectToMongo(dbName,function(err,dbInstance) {

                //This Api will Save the uploaded File into GridFS
                var SaveFileToGrid = function (callback) {
                    var fileName = req.file.filename;
                    var ApnsObj = require('../functions/upload.js');

                    //This will call the api which saves the file into GridFS
                    ApnsObj.uploadCertificate(fileName, dbInstance, function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        else {
                            return callback(null, result);
                        }
                    });

                };

                //This Api is used to save the settings info for a particular instanceId
                var saveSettingsConfig = function (apnsObj, callback) {

                    var settings = new settingsModel({

                        apnsPassword: req.body.passPhrase,
                        apnsCertificate: apnsObj.filename,
                        instanceID: req.body.instanceId

                    });
                    var SettingsObj = require('../functions/Settings.js');

                    SettingsObj.saveSettingsInfo(settingsModel, req.body.instanceId, settings, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        else {
                            return callback(null, apnsObj);
                        }
                    });
                }

                var finalCallback = function (err, fileInfo) {
                    afterResponse(dbInstance.dbConnection);
                    if (err) {

                        res.json(err);
                        res.status(400).end();

                    }
                    else {
                        console.log("fileInfo", fileInfo)
                        res.json({"message": "File Uploaded Successfully"});
                        res.status(204).end();

                    }
                };

                //Here the control flow is in sequential
                async.waterfall([SaveFileToGrid, saveSettingsConfig], finalCallback);


            });
        }
        catch(err){
            res.json(err);
            res.status(400).end();
        }



    });


    app.delete('/file/:fileName',function(req,res) {
        //TODO :: pass the dynamic DB instanceName created in dbName
        var dbName = "push12";

        //This method will create a DB connection with db name as dbName
        connector.connectToMongo(dbName, function (err, dbInstance) {


            dbInstance.gridStore.unlink(dbInstance.dbConnection, req.params.fileName, {root:"fs.files" }, function (err, doc) {
            dbInstance.gridStore.unlink(dbInstance.dbConnection, req.params.fileName, {root:"fs.files" }, function (err, doc) {
                    afterResponse(dbInstance.dbConnection);
                if (err) {
                    console.log("cgjhngjkhgjkghjkh")
                    res.json(err);
                    res.status(400).end();
                }else{
                    res.json({"message": "File Deleted Successfully"});
                    res.status(204).end();

                }

                });


//
//            var options = {
//                  filename:req.params.fileName,
//                  _id : '57871ae49e642a5c02e66c12'
//            };
//            dbInstance.gfs.remove(options, function (err) {
//                afterResponse(dbInstance.dbConnection);
//                if (err) {
//                    console.log("cgjhngjkhgjkghjkh")
//                    res.json(err);
//                    res.status(400).end();
//                }else{
//                    res.json({"message": "File Deleted Successfully"});
//                    res.status(204).end();
//
//                }
//
//            });

        });
    });

};


