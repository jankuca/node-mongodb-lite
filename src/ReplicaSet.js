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
		callback(primary.getConnection());
	} else {
		this.connect(function () {
			self.getWritableConnection(callback);
		});
	}
};

ReplicaSet.prototype.connect = function (callback) {
	var self = this;
	var servers = this.servers_;
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
