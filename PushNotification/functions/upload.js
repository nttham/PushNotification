/**
 * Created by cognizant on 15/07/16.
 */
exports.uploadCertificate = function(fileName,dbInstance,callback) {
    var fs =require('fs');

    try {

        var filePath = process.cwd() + '/uploads/' + fileName;

        var writestream = dbInstance.gfs.createWriteStream({
            filename: fileName
        });

        fs.createReadStream(filePath).pipe(writestream);
        writestream.on('close', function (file) {
            fs.unlink(filePath, function () {

                console.log("file ************* "+JSON.stringify(file));
                return callback(null,file);


            });
        });
    }catch(err){
        return callback(err);
    }


};