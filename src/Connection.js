var net = require('net');

var EventEmitter = require('events').EventEmitter;
var ReplyMessage = require('./ReplyMessage');


var Connection = function (server) {
	EventEmitter.call(this);

	this.server_ = server;
	this.socket_ = null;
};

require('util').inherits(Connection, EventEmitter);


Connection.prototype.open = function () {
	var server = this.server_;

	var self = this;
	var socket = new net.Socket();
	socket.connect(server.port, server.host, function () {
		self.emit('open');

		socket.on('data', function (chunk) {
			var message = new ReplyMessage(chunk);
			self.emit('message', message);
		});
	});
	socket.on('error', function (err) {
		self.emit('error', err);
	});
	socket.on('close', function () {
		self.emit('close');
	});

	this.socket_ = socket;
};

Connection.prototype.close = function () {
	this.socket_.end();
};

Connection.prototype.postMessage = function (buffer) {
	var socket = this.socket_;
	socket.write(buffer);
};

Connection.prototype.waitForReplyTo = function (request_id, callback) {
	var self = this;
	var socket = this.socket_;

	var listener = function (message) {
		if (message.getRequestId() === request_id) {
			self.removeListener('message', listener);

			if (message.isError()) {
				var response = message.getDocumentAt(0);
				callback(new Error(response['$err']), message);
			} else {
				callback(null, message);
			}
		}
	};

	this.on('message', listener);
};


module.exports = Connection;
