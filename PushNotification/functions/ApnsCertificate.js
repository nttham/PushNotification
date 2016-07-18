/**
 * Created by cognizant on 15/07/16.
 */
exports.getCertificate = function(fileName,dbInstance,callback) {
    var fileObj = {filename: fileName};
    dbInstance.gfs.files.find(fileObj).toArray(function (err, files) {
        if (err) {

            return callback(err);
        }
        else {
            if (files.length > 0) {
                var read_stream = gfs.createReadStream({filename: fileName});

                var options = {};

                var bufs = [];
                read_stream.on('data', function(d){ bufs.push(d); });
                read_stream.on('end', function() {
                    var buf = Buffer.concat(bufs);
                    options.pfx = buf;
                    return callback(null,options);
                });

            }
            else {

                return callback({"error": "File Not Found"});

            }
        }


    });
};
