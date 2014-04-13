var crypto = require('crypto');

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
	var socket = server.createSocket();
	socket.connect(server.port, server.host, function () {
		self.emit('open');

		var message = null;
		socket.on('data', function (chunk) {
			if (message) {
				message.addData(chunk);
			} else {
				message = new ReplyMessage(chunk);
			}

			if (message.isComplete()) {
				self.emit('message', message);
				message = null;
			}
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

Connection.prototype.isAuthenticated = function () {
	return this.authenticated_;
};

Connection.prototype.authenticate = function (database, callback) {
	var self = this;
	var server = this.getServer();
	var username = server.username;

	if (!username) {
		this.authenticated_ = true;
		callback(null);
	} else {
		this.getNonce_(database, function (err, nonce) {
			if (err) {
				callback(err);
			} else {
				self.authenticate_(database, nonce, callback);
			}
		});
	}
};

Connection.prototype.getNonce_ = function (database, callback) {
	var cmd = database.createCommand('getnonce');

	var buffer = cmd.build();
	this.postMessage(buffer);
	this.waitForReplyTo(cmd.getRequestId(), function (err, message) {
		if (err) {
			callback(err, null);
		} else {
			var response = message.getDocumentAt(0);
			var err = response['ok'] ? null : new Error(response['errmsg']);
			callback(err, response['nonce'] || null);
		}
	});
};

Connection.prototype.authenticate_ = function (database, nonce, callback) {
	var self = this;
	var server = this.getServer();
	var username = server.username;
	var password = server.password;

	var password_digest = crypto.createHash('md5')
		.update(username + ':mongo:' + password).digest('hex');
	var key = nonce + username + password_digest;

	var cmd = database.createCommand('authenticate', {
		'user': username,
		'nonce': nonce,
		'key': crypto.createHash('md5').update(key).digest('hex')
	});

	var buffer = cmd.build();
	this.postMessage(buffer);
	this.waitForReplyTo(cmd.getRequestId(), function (err, message) {
		if (err) {
			callback(err);
		} else {
			var response = message.getDocumentAt(0);
			self.authenticated_ = !!response['ok'];
			callback(response['ok'] ? null : new Error(response['errmsg']));
		}
	});
};


Connection.prototype.getServer = function () {
	return this.server_;
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
