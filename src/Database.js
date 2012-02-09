var Command = require('./Command');
var Collection = require('./Collection');
var ReplicaSet = require('./ReplicaSet');


var Database = function (db_name, server) {
	this.name = db_name;

	if (server.isReplicaSet()) {
		this.replica_set_ = server;
	} else {
		this.server_ = server;
	}
};

Database.prototype.getCollection = function (collection_name) {
	return new Collection(collection_name, this);
};

Database.prototype.getWritableConnection = function (callback) {
	if (this.server_) {
		this.server_.getConnection(callback);
	} else {
		this.replica_set_.getWritableConnection(callback);
	}
};

Database.prototype.createCommand = function (action, params) {
	var cmd = new Command(action, params);
	cmd.database = this.name;

	return cmd;
};


module.exports = Database;
