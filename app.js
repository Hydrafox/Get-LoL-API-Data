/**
Improvement
	We may stock the keyRequestLimitByTenMinutes and keyRequestLimitByTenSeconds in a global variable
	Like that, we can still keeping how many requests the user made even if he didn't submited only one request
/**/

var app = require("express")(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	express = require('express'),
	port = (process.env.VCAP_APP_PORT || 3001); 
	host = (process.env.VCAP_APP_HOST || "localhost"); 



// Define public folder
app.use(express.static(__dirname));

// Chargement de la page index.html
app.get('/', function (req, res) {
  	res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket, pseudo) {
		
	require("./getData/FillDatabase.js")();
	var fillDatabase = new FillDatabase(socket);

	socket.on('form', function(form) {

		socket.emit('action', "clean logs"); // Clean the logs
		console.log(form);
		fillDatabase.start(form);
	});

	socket.on('getJsonFile', function() {
		fillDatabase.createJsonFile();
	});
});

server.listen(port,host); 