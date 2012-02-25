var Database = require('./Database');


var ReplicaSet = function (name) {
	this.name_ = name;

	this.servers_ = [];
	this.primary_ = null;
};

ReplicaSet.prototype.isReplicaSet = function () {
	return true;
};

ReplicaSet.prototype.addServer = function (server) {
	this.servers_.push(server);
};

ReplicaSet.prototype.getDatabase = function (name) {
	return new Database(name, this);
};

ReplicaSet.prototype.getWritableConnection = function (callback) {
	var self = this;
	var primary = this.primary_;
	if (primary && primary.isConnected()) {
		primary.getConnection(callback);
	} else {
		this.connect(function () {
			if (self.primary_) {
				self.getWritableConnection(callback);
			} else {
				callback(null);
			}
		});
	}
};

ReplicaSet.prototype.connect = function (callback) {
	var self = this;
	var servers = this.servers_;

	if (!servers.length) {
		throw new Error('No replica set servers specified');
	}

	var i = 0;
	(function iter() {
		if (i === servers.length) {
			return callback();
		}

		var server = servers[i++];
		var key = server.name;
		if (server.isConnected()) {
			if (server.isPrimary()) {
				self.primary_ = server;
			}
			iter();
		} else {
			server.connect(function () {
				if (server.isPrimary()) {
					self.primary_ = server;
				}
				iter();
			});
		}
	}());
};


module.exports = ReplicaSet;
