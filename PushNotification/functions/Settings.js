exports.saveSettingsInfo = function(settingsModel,instanceId,settings,callback) {
    settingsModel.find({instanceID : instanceId}, function(err,instances){

        var totalInstances = instances.length;

        if (totalInstances == 0) {

            settings.save(function(err){

                if (err) {

                    return callback({"error":"Error in Saving File"});

                } else {

                    return callback(null,settings);


                }
            });
        } else {

            return callback({"error":"Certificate already exists for the instance"});



        }
    });
};

exports.getSettings= function(instanceId,callback) {

    var settingsModel =  require('../models/Settings.js');
    settingsModel.find( {"instanceID":instanceId},function(err,result){
        if(err){

            return callback(err);
        }
        else{

            return callback(null,result);
        }
    });


};