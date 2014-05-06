var Command = require('./Command');
var DeleteMessage = require('./DeleteMessage');
var InsertMessage = require('./InsertMessage');
var ObjectId = require('buffalo').ObjectId;
var QueryMessage = require('./QueryMessage');
var UpdateMessage = require('./UpdateMessage');


var Collection = function (collection_name, database) {
	this.name = collection_name;
	this.full_name = database.name + '.' + collection_name;
	this.database_ = database;
};

Collection.prototype.insert = function (docs, callback) {
	if (!Array.isArray(docs)) {
		docs = [ docs ];
	}

	this.insert_(docs, callback);
};

Collection.prototype.insert_ = function (docs, callback) {
	docs.forEach(function (doc) {
		doc['_id'] = doc['_id'] || new ObjectId();
	});

	var self = this;
	this.database_.getWritableConnection(function (connection) {
		var insert = new InsertMessage();
		insert.collection = self.full_name;

		docs.forEach(function (doc) {
			insert.addDocument(doc);
		});

		var buffer = insert.build();
		connection.postMessage(buffer);

		if (callback) {
			self.getLastError(connection, callback);
		}
	});
};

Collection.prototype.update = function (selector, doc, callback) {
	var self = this;
	this.database_.getWritableConnection(function (connection) {
		var update = new UpdateMessage();
		update.collection = self.full_name;
		update.document = doc;
		update.query = selector;

		// Multi update works only with $ operators.
		var doc_keys = Object.keys(doc);
		var only_mods = doc_keys.every(function (key) {
			return (key[0] === '$');
		});
		if (only_mods) {
			update.setFlag(UpdateMessage.Flags.MULTI_UPDATE, false);
		} else {
			update.setFlag(UpdateMessage.Flags.UPSERT, false);
		}

		var buffer = update.build();
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
		remove.query = selector;

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

Collection.prototype.createCommand = function (action_name, params) {
	var action = {};
	action[action_name] = this.name;

	var cmd = this.database_.createCommand(action, params);
	return cmd;
};

Collection.prototype.exec = function (cmd, callback) {
	this.database_.postCommand(cmd, function (err, response) {
		if (err) {
			return callback(err, null);
		}

		var docs = response.getAllDocuments();
		callback(err, docs);
	});
};

Collection.prototype.drop = function (callback) {
	var cmd = this.createCommand('drop');
	this.exec(cmd, callback);
};

Collection.prototype.findOne = function (selector, options, callback) {
	if (arguments.length === 2 && typeof arguments[1] === 'function') {
		callback = arguments[1];
		options = {};
	}

	options = options || {};
	options.offset = options.offset || 0;
	options.limit = (options.limit !== undefined) ? options.limit : 1;

	this.find_(selector, options, function (err, response) {
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

	this.find_(selector, options, function (err, response) {
		callback(err, response ? response.getAllDocuments() : null);
	});
};

Collection.prototype.find_ = function (selector, options, callback) {
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
		if (options.fields) {
			message.field_selector = options.fields;
		}

		var buffer = message.build();
		connection.postMessage(buffer);
		connection.waitForReplyTo(message.getRequestId(), callback);
	});
};

Collection.prototype.count = function (selector, callback) {
	var cmd = this.createCommand('count', {
		'query': selector
	});

	this.database_.postCommand(cmd, function (err, result) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, result.getDocumentAt(0)['n']);
		}
	});
};

Collection.prototype.getLastError = function (connection, callback) {
	var cmd = this.database_.createCommand('getlasterror', {
		'w': 1
	});

	this.database_.postCommand(cmd, function (err, reply) {
		if (err) {
			return callback(err, null);
		}
		var result = reply.getDocumentAt(0);
		callback(result['err'] || null, result);
	});
};


module.exports = Collection;
