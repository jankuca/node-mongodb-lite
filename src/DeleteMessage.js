var buffalo = require('buffalo');

var Message = require('./Message');


var DeleteMessage = function () {
	Message.call(this, Message.OpCodes.OP_DELETE);

	this.setFlag(DeleteMessage.Flags.SINGLE_REMOVE, false);

	this.selector = {};
};

require('util').inherits(DeleteMessage, Message);


DeleteMessage.prototype.build = function () {
	var collection = this.collection;
	var selector = buffalo.serialize(this.selector);

	var length = 16; // MsgHeader header
	length += 4; // int32 ZERO
	length += collection.length + 1; // cstring fullCollectionName
	length += 4; // int32 flags
	length += selector.length; // document selector

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

	return buffer;
};


DeleteMessage.Flags = {
	SINGLE_REMOVE: 0
};


module.exports = DeleteMessage;
