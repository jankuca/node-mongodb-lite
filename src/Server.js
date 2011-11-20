var url = require('url');

var Connection = require('./Connection');
var Database = require('./Database');


var Server = function (mongodb_url) {
	this.url = url.parse(mongodb_url);
	this.host = this.url.hostname;
	this.port = this.url.port;

	this.connection_ = null;
};

Server.prototype.getDatabase = function (db_name) {
	return new Database(db_name, this);
};

Server.prototype.getConnection = function (callback) {
	var connection = this.connection_;
	if (connection) {
		callback(connection);
	} else {
		connection = this.connect(callback);
	}
};

Server.prototype.connect = function (callback) {
	var connection = new Connection(this);
	connection.open();

	var self = this;
	connection.on('open', function () {
		self.connection_ = connection;
		callback(connection);
	});
	connection.on('close', function () {
		self.connection_ = null;
	});
	connection.on('error', function (err) {
		throw err;
		self.connection_ = null;
	});
};

Server.prototype.close = function () {
	if (this.connection_) {
		this.connection_.close();
	}
};


module.exports = Server;
