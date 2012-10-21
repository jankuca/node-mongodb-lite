var buffalo = require('buffalo');

var Message = require('./Message');


var ReplyMessage = function (buffer) {
	Message.call(this, Message.OpCodes.OP_REPLY);

	var i = 0;

	// int32 length
	this.length = (buffer[i++] | buffer[i++] << 8 | buffer[i++] << 16 | buffer[i++] << 24);

	// int32 requestID
	i += 4;

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
	this.documents_ = [];
	this.incomplete_document_data_ = null;
	this.addData(buffer.slice(i));
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

ReplyMessage.prototype.addData = function (buffer) {
	var i = 0;

	var prev = this.incomplete_document_data_;
	if (prev) {
		buffer = Buffer.concat([prev, buffer]);
	}

	for (var o = this.documents_.length, oo = this.limit; o < oo; ++o) {
		var document_length = (buffer[i] | buffer[i + 1] << 8 | buffer[i + 2] << 16 | buffer[i + 3] << 24);
		if (buffer.length < i + document_length) {
			this.incomplete_document_data_ = buffer.slice(i);
			return;
		}

		var document_data = buffer.slice(i, i + document_length);
		this.documents_.push(buffalo.parse(document_data));
		// int32 length (of one document)
		i += document_length;
	}
};


ReplyMessage.prototype.isComplete = function () {
	return (this.limit === this.documents_.length);
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
