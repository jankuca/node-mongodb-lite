var QueryMessage = require('./QueryMessage');


var Command = function (action, params) {
	this.action_ = this.normalizeAction_(action);
	this.params_ = params || {};

	this.message_ = new QueryMessage();

	this.database = null;
};

Command.prototype.getMessage = function () {
	return this.message_;
};

Command.prototype.normalizeAction_ = function (action) {
	var key;
	var value;
	if (typeof action === 'object') {
		key = Object.keys(action)[0];
		value = action[key];
	} else {
		key = action;
		value = 1;
	}

	var normalized = {};
	normalized[key] = value;
	return normalized;
};

Command.prototype.populateMessage_ = function () {
	var message = this.message_;

	var q = {};

	var action = this.action_;
	var action_key = Object.keys(action)[0];
	q[action_key] = action[action_key];

	var params = this.params_;
	Object.keys(params).forEach(function (key) {
		q[key] = params[key];
	});

	message.query = q;
	message.limit = 0xFFFFFFFF;
	message.collection = this.database + '.$cmd';
};

Command.prototype.build = function () {
	if (!this.database) {
		throw new Error('No database specified');
	}

	this.populateMessage_();

	return this.message_.build();
};

Command.prototype.getRequestId = function () {
	return this.message_.getRequestId();
};


module.exports = Command;
