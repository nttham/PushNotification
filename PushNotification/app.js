var express = require('express');
var bodyParser = require('body-parser');
var app      = express();
var port     = process.env.PORT || 3001;
var logger = require('morgan');
var io = require('socket.io');
var path = require('path');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(logger('dev'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


var listen = app.listen(port);
var socket = io.listen(listen);

require('./routes/routes')(app,socket);

console.log('The App runs on port ' + port);
