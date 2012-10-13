var QueryMessage = require('./QueryMessage');


var Command = function (action, params) {
	params = params || {};

	var message = new QueryMessage();

	var key = action;
	var value = 1;
	if (typeof action === 'object') {
		key = Object.keys(action)[0];
		value = action[key];
	}

	var q = {};
	q[key] = value;
	Object.keys(params).forEach(function (key) {
		q[key] = params[key];
	});
	message.query = q;
	message.limit = 0xFFFFFFFF;

	this.message_ = message;

	this.database = null;
};

Command.prototype.build = function () {
	if (!this.database) {
		throw new Error('No database specified');
	}
	this.message_.collection = this.database + '.$cmd';

	return this.message_.build();
};

Command.prototype.getRequestId = function () {
	return this.message_.getRequestId();
};


module.exports = Command;
