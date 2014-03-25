var Command = require('./Command');
var Collection = require('./Collection');


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
	var self = this;

	var onConnection = function (connection) {
		if (!connection) {
			callback(null);
		} else if (connection.isAuthenticated()) {
			callback(connection);
		} else {
			connection.authenticate(self, function (err) {
				if (err) {
					console.log(err.stack);
					callback(null);
				} else {
					callback(connection);
				}
			});
		}
	};

	if (this.server_) {
		this.server_.getConnection(onConnection);
	} else {
		this.replica_set_.getWritableConnection(onConnection);
	}
};

Database.prototype.createCommand = function (action, params) {
	var cmd = new Command(action, params);
	cmd.database = this.name;

	return cmd;
};

Database.prototype.postCommand = function (cmd, callback) {
	this.getWritableConnection(function (connection) {
		if (!connection) {
			callback(new Error('No writable connection available'), null);
			return;
		}

		var buffer = cmd.build();
		connection.postMessage(buffer);
		connection.waitForReplyTo(cmd.getRequestId(), function (err, message) {
			if (err) {
				callback(err, null);
			} else {
				var response = message.getDocumentAt(0);
				callback(response['err'] ? new Error(response['err']) : null, message);
			}
		});
	});
};


module.exports = Database;
