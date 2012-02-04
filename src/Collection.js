var Command = require('./Command');
var DeleteMessage = require('./DeleteMessage');
var InsertMessage = require('./InsertMessage');
var QueryMessage = require('./QueryMessage');
var UpdateMessage = require('./UpdateMessage');


var Collection = function (collection_name, database) {
	this.name = collection_name;
	this.full_name = database.name + '.' + collection_name;
	this.database_ = database;
};

Collection.prototype.insert = function (doc, callback) {
	var self = this;
	this.database_.getWritableConnection(function (connection) {
		var insert = new InsertMessage();
		insert.collection = self.full_name;
		insert.addDocument(doc);

		var buffer = insert.build();
		connection.postMessage(buffer);

		if (callback) {
			self.getLastError(connection, callback);
		}
	});
};

Collection.prototype.remove = function (selector, options, callback) {
	if (arguments.length === 1 && typeof arguments[0] === 'function') {
		callback = arguments[0];
		selector = {};
	}
	if (arguments.length === 2 && typeof arguments[1] === 'function') {
		callback = arguments[1];
		options = {};
	}
	options = options || {};

	var self = this;
	this.database_.getWritableConnection(function (connection) {
		var remove = new DeleteMessage();
		remove.collection = self.full_name;
		remove.selector = selector;

		if (options.limit) {
			if (options.limit !== 1) {
				throw new Error('Invalid limit; the only valid values are 0 and 1');
			}
			remove.setFlag(DeleteMessage.Flags.SINGLE_REMOVE, true);
		}

		var buffer = remove.build();
		connection.postMessage(buffer);

		if (callback) {
			self.getLastError(connection, callback);
		}
	});
};

Collection.prototype.findOne = function (selector, callback) {
	var options = {
		offset: 0,
		limit: 1
	};
	this.find(selector, options, function (err, response) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, response.getDocumentAt(0));
		}
	});
};

Collection.prototype.find = function (selector, options, callback) {
	if (arguments.length === 2 && typeof arguments[1] === 'function') {
		callback = arguments[1];
		options = {};
	}

	var self = this;
	this.database_.getWritableConnection(function (connection) {
		if (!connection) {
			callback(new Error('No writable connection available'), null);
			return;
		}

		var message = new QueryMessage();
		message.collection = self.full_name;
		message.query = selector;
		message.offset = options.offset || 0;
		message.limit = options.limit || 0;

		var buffer = message.build();
		connection.postMessage(buffer);
		connection.waitForReplyTo(message.getRequestId(), callback);
	});
};

Collection.prototype.getLastError = function (connection, callback) {
	var cmd = this.database_.createCommand('getlasterror', {
		'w': 1
	});
	cmd.database = this.database_.name;

	var buffer = cmd.build();
	connection.postMessage(buffer);
	connection.waitForReplyTo(cmd.getRequestId(), function (err, message) {
		if (err) {
			callback(err, null);
		} else {
			var response = message.getDocumentAt(0);
			callback(response['err'] ? new Error(response['err']) : null);
		}
	});
};


module.exports = Collection;
