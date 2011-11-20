var buffalo = require('buffalo');

var Message = require('./Message');


var ReplyMessage = function (buffer) {
	Message.call(this, Message.OpCodes.OP_REPLY);

	var i = 8; // int32 length, int32 requestID
	// int32 responseTo
	this.request_id_ = (buffer[i++] | buffer[i++] << 8 | buffer[i++] << 16 | buffer[i++] << 24);

	// int32 opCode
	i += 4;

	// int32 responseFlags
	i += this.readFlags_(buffer, i);

	// int64 cursorID
	this.cursor_id_ = (buffer[i++] | buffer[i++] << 8 | buffer[i++] << 16 | buffer[i++] << 24 |
		buffer[i++] << 32 | buffer[i++] << 40 | buffer[i++] << 48 | buffer[i++] << 56);

	// int32 startingFrom
	this.offset = (buffer[i++] | buffer[i++] << 8 | buffer[i++] << 16 | buffer[i++] << 24);

	// int32 numberReturned
	this.limit = (buffer[i++] | buffer[i++] << 8 | buffer[i++] << 16 | buffer[i++] << 24);

	// document* documents
	var documents = [];
	for (var o = 0, oo = this.limit; o < oo; ++o) {
		documents.push(buffalo.parse(buffer, i));
		// int32 length (of one document)
		i += (buffer[i] | buffer[i + 1] << 8 | buffer[i + 2] << 16 | buffer[i + 3] << 24);
	}
	this.documents_ = documents;
};

require('util').inherits(ReplyMessage, Message);


ReplyMessage.prototype.readFlags_ = function (buffer, offset) {
	var i = offset;

	var flags = (buffer[i++] | buffer[i++] << 8 | buffer[i++] << 16 | buffer[i++] << 24);
	for (var o = 0; o < 32; ++o) {
		this.flags[o] = Boolean((flags >> o) & 0x1);
	}

	return i - offset;
};

ReplyMessage.prototype.getDocumentAt = function (index) {
	return this.documents_[index] || null;
};

ReplyMessage.prototype.getAllDocuments = function (index) {
	return this.documents_.slice();
};

ReplyMessage.prototype.isError = function () {
	return this.flags[ReplyMessage.Flags.QUERY_FAILURE];
}


ReplyMessage.Flags = {
	CURSOR_NOT_FOUND: 0,
	QUERY_FAILURE: 1,
	SHARD_CONFIG_STALE: 2,
	AWAIT_CAPABLE: 3
};


module.exports = ReplyMessage;
