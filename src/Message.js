var buffalo = require('buffalo');


var Message = function (op_code, request_id) {
	this.op_code_ = op_code;
	this.request_id_ = request_id || 0;
	if (!request_id && op_code !== Message.OpCodes.OP_REPLY) {
		this.request_id_ = ++Message.request_id_counter_;
	}

	this.collection = null;
	this.flags = new Array(32);
};

Message.request_id_counter_ = 0;

Message.prototype.getRequestId = function () {
	return this.request_id_ || null;
};

Message.prototype.setFlag = function (index, value) {
	this.flags[index] = value || false;
};

Message.prototype.getFlag = function (index) {
	return this.flags[index] || false;
};

Message.prototype.writeHeader_ = function (buffer, length) {
	var i = 0;

	// int32 messageLength
	buffer[i++] = length & 0xFF;
	buffer[i++] = (length >> 8) & 0xFF;
	buffer[i++] = (length >> 16) & 0xFF;
	buffer[i++] = (length >> 24) & 0xFF;
	// int32 requestID
	var request_id = this.request_id_;
	buffer[i++] = request_id & 0xFF;
	buffer[i++] = (request_id >> 8) & 0xFF;
	buffer[i++] = (request_id >> 16) & 0xFF;
	buffer[i++] = (request_id >> 24) & 0xFF;
	// int32 responseTo
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	// int32 opCode
	var op_code = this.op_code_;
	buffer[i++] = op_code & 0xFF;
	buffer[i++] = (op_code >> 8) & 0xFF;
	buffer[i++] = (op_code >> 16) & 0xFF;
	buffer[i++] = (op_code >> 24) & 0xFF;

	return i;
};

Message.prototype.writeFlags_ = function (buffer, offset) {
	var i = offset;

	// int32 flags
	var flags_binary = this.flags.map(function (value) { return value ? 1 : 0; }).join('');
	var flags = parseInt(flags_binary, 2);
	buffer[i++] = flags & 0xFF;
	buffer[i++] = (flags >> 8) & 0xFF;
	buffer[i++] = (flags >> 16) & 0xFF;
	buffer[i++] = (flags >> 24) & 0xFF;

	return i - offset;
};


Message.OpCodes = {
	OP_REPLY: 1,
	OP_MSG: 1000,
	OP_UPDATE: 2001,
	OP_INSERT: 2002,
	RESERVED: 2003,
	OP_QUERY: 2004,
	OP_GET_MORE: 2005,
	OP_DELETE: 2006,
	OP_KILL_CURSORS: 2007
};


module.exports = Message;
