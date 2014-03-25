var buffalo = require('buffalo');

var Message = require('../src/Message');


var MockReplyMessage = function (request_buffer, state) {
	this.state = state || {};

	var id = request_buffer.slice(4, 8);
	this.request_id_ = (id[0] | id << 8 | id << 16 | id << 24);

	this.documents_ = [];
};


MockReplyMessage.prototype.isError = function () {
	return Boolean(this.state.error);
};


MockReplyMessage.prototype.isComplete = function () {
	return ('complete' in this.state) ? this.state.complete : true;
};


MockReplyMessage.prototype.addDocument = function (document) {
	this.documents_.push(document);
};


MockReplyMessage.prototype.getDocumentAt = function (index) {
	return this.documents_[index] || null;
};


MockReplyMessage.prototype.getAllDocuments = function () {
	return this.documents_.slice();
};


MockReplyMessage.prototype.getRequestId = function () {
	return this.request_id_;
}


MockReplyMessage.prototype.toBuffer = function () {
	var length = 0;
	length += 4; // int32 length
	length += 4; // int32 requestID
	length += 4; // int32 responseTo
	length += 4; // int32 opCode
	length += 4; // int32 responseFlags
	length += 4; // int32 cursorID
	length += 4; // int32 startingFrom
	length += 4; // int32 numberReturned

	var documents = this.documents_.map(function (document) {
		var bson = buffalo.serialize(document);
		length += bson.length;
		return bson;
	});

	var buffer = new Buffer(length);
	var i = 0;

	// int32 length
	buffer[i++] = length & 0xFF;
	buffer[i++] = (length >> 8) & 0xFF;
	buffer[i++] = (length >> 16) & 0xFF;
	buffer[i++] = (length >> 24) & 0xFF;

	// int32 requestID
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;

	// int32 responseTo
	buffer[i++] = this.request_id_ & 0xFF;
	buffer[i++] = (this.request_id_ >> 8) & 0xFF;
	buffer[i++] = (this.request_id_ >> 16) & 0xFF;
	buffer[i++] = (this.request_id_ >> 24) & 0xFF;

	// int32 opCode
	buffer[i++] = Message.OpCodes.OP_REPLY & 0xFF;
	buffer[i++] = (Message.OpCodes.OP_REPLY >> 8) & 0xFF;
	buffer[i++] = (Message.OpCodes.OP_REPLY >> 16) & 0xFF;
	buffer[i++] = (Message.OpCodes.OP_REPLY >> 24) & 0xFF;

	// int32 responseFlags
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;

	// int32 cursorID
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;

	// int32 startingFrom
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;

	// int32 numberReturned
	buffer[i++] = documents.length & 0xFF;
	buffer[i++] = (documents.length >> 8) & 0xFF;
	buffer[i++] = (documents.length >> 16) & 0xFF;
	buffer[i++] = (documents.length >> 24) & 0xFF;

	documents.forEach(function (bson) {
		i += bson.copy(buffer, i);
	});

	return buffer;
};


module.exports = MockReplyMessage;
