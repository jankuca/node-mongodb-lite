var buffalo = require('buffalo');

var Message = require('./Message');


var InsertMessage = function () {
	Message.call(this, Message.OpCodes.OP_INSERT);

	this.setFlag(InsertMessage.Flags.CONTINUE_ON_ERROR, false);

	this.documents_ = [];
};

require('util').inherits(InsertMessage, Message);


InsertMessage.prototype.addDocument = function (doc) {
	this.documents_.push(doc);
};

InsertMessage.prototype.build = function () {
	var collection = this.collection;
	var documents = this.documents_.map(function (doc) {
		return buffalo.serialize(doc);
	});

	var length = 16; // MsgHeader header
	length += 4; // int32 flags
	length += collection.length + 1; // cstring fullCollectionName
	documents.forEach(function (doc) {
		length += doc.length; // document document
	});

	var buffer = new Buffer(length);
	var i = this.writeHeader_(buffer, length);

	// int32 flags
	i += this.writeFlags_(buffer, i);

	// cstring fullCollectionName
	i += buffer.write(collection, i, 'utf8');
	buffer[i++] = 0x00;

	// document* documents
	documents.forEach(function (doc) {
		i += doc.copy(buffer, i);
	});

	return buffer;
};


InsertMessage.Flags = {
	CONTINUE_ON_ERROR: 0
};


module.exports = InsertMessage;
