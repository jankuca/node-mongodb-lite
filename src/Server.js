var log = require('sys').log;
var url = require('url');

var Command = require('./Command');
var Connection = require('./Connection');
var Database = require('./Database');


var Server = function (mongodb_url) {
	if (!mongodb_url) {
		throw new Error('Missing MongoDB URL');
	}

	this.name = mongodb_url;
	this.url = url.parse(mongodb_url);
	this.host = this.url.hostname;
	this.port = this.url.port;

	this.connection_ = null;
	this.is_primary_ = false;
};

Server.prototype.isReplicaSet = function () {
	return false;
};

Server.prototype.getDatabase = function (db_name) {
	return new Database(db_name, this);
};

Server.prototype.isConnected = function () {
	return !!this.connection_;
};

Server.prototype.isPrimary = function () {
	return this.is_primary_;
};

Server.prototype.getConnection = function (callback) {
	var connection = this.connection_;
	if (connection) {
		callback(connection);
	} else {
		this.connect(callback);
	}
};

Server.prototype.connect = function (callback) {
	var connection = new Connection(this);

	var called_back = false;
	var self = this;
	connection.once('open', function () {
		log('Info: Database connection open');
		self.connection_ = connection;

		self.checkIfPrimary_(function (primary) {
			if (!called_back) {
				called_back = true;
				callback(connection);
			}
		});
	});
	connection.once('close', function () {
		self.connection_ = null;
		self.is_primary_ = false;
	});
	connection.once('error', function (err) {
		log(err.toString());
		self.connection_ = null;
		self.is_primary_ = false;
		if (!called_back) {
			called_back = true;
			callback(null);
		}
	});

	connection.open();
};

Server.prototype.checkIfPrimary_ = function (callback) {
	var self = this;
	var connection = this.connection_;
	if (!connection) {
		callback(false);
	} else {
		var cmd = new Command('ismaster');
		cmd.database = 'db';

		connection.postMessage(cmd.build());
		connection.waitForReplyTo(cmd.getRequestId(), function (err, message) {
			if (err) {
				callback(err);
			} else {
				var response = message.getDocumentAt(0);
				var is_primary = !!response && !!response.ismaster;
				self.is_primary_ = is_primary;
				callback(is_primary);
			}
		});
	}
};

Server.prototype.close = function () {
	if (this.connection_) {
		this.connection_.close();
	}
};


module.exports = Server;
