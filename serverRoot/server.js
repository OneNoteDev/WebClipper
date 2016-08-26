"use strict";

var https = require("https");
var port = process.argv[2] || 8043;
var fs = require("fs");
var path = require("path");
var nodeStatic = require( "node-static" );

require("ssl-root-cas")
 	.inject()
 	.addFile(path.join(__dirname, "certs", "server", "my-root-ca.crt.pem"));

var options = {
	key: fs.readFileSync(path.join(__dirname, "certs", "server", "my-server.key.pem")),
	cert: fs.readFileSync(path.join(__dirname, "certs", "server", "my-server.crt.pem"))
};

var file = new nodeStatic.Server( "serverRoot/root", {
	cache: 3600,
	gzip: true
} );

var server = https.createServer(options, function (request, response) {
	request.addListener( "end", function () {
		file.serve( request, response );
	} ).resume();
}).listen(port, function () {
	port = server.address().port;
	console.log("Listening on https://localhost:" + port);
});
