var buffalo = require('buffalo');

var Message = require('./Message');


var UpdateMessage = function () {
	Message.call(this, Message.OpCodes.OP_UPDATE);

	this.setFlag(UpdateMessage.Flags.UPSERT, true);
	this.setFlag(UpdateMessage.Flags.MULTI_UPDATE, true);

	this.query = {};
	this.document = {};
};

require('util').inherits(UpdateMessage, Message);


UpdateMessage.prototype.build = function () {
	var collection = this.collection;
	var selector = buffalo.serialize(this.query);
	var document = buffalo.serialize(this.document);

	var length = 16; // MsgHeader header
	length += 4; // int32 ZERO
	length += collection.length + 1; // cstring fullCollectionName
	length += 4; // int32 flags
	length += selector.length; // document selector
	length += document.length; // document update

	var buffer = new Buffer(length);
	var i = this.writeHeader_(buffer, length);

	// int32 ZERO
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;
	buffer[i++] = 0x00;

	// cstring fullCollectionName
	i += buffer.write(collection, i, 'utf8');
	buffer[i++] = 0x00;

	// int32 flags
	i += this.writeFlags_(buffer, i);

	// document selector
	i += selector.copy(buffer, i);

	// document update
	i += document.copy(buffer, i);

	return buffer;
};


UpdateMessage.Flags = {
	UPSERT: 0,
	MULTI_UPDATE: 1
};


module.exports = UpdateMessage;
