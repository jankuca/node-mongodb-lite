var buffalo = require('buffalo');

var Message = require('./Message');


var QueryMessage = function () {
	Message.call(this, Message.OpCodes.OP_QUERY);

	this.setFlag(QueryMessage.Flags.TAILABLE_CURSOR, false);
	this.setFlag(QueryMessage.Flags.SLAVE_OK, false);
	this.setFlag(QueryMessage.Flags.OPLOG_REPLAY, false);
	this.setFlag(QueryMessage.Flags.NO_CURSOR_TIMEOUT, false);
	this.setFlag(QueryMessage.Flags.AWAIT_DATA, false);
	this.setFlag(QueryMessage.Flags.EXHAUST, false);
	this.setFlag(QueryMessage.Flags.PARTIAL, false);

	this.offset = 0;
	this.limit = 0;
	this.query = {};
	this.field_selector = null;
};

require('util').inherits(QueryMessage, Message);


QueryMessage.prototype.build = function () {
	var collection = this.collection;
	var query = buffalo.serialize(this.query);
	var field_selector = this.field_selector ? buffalo.serialize(this.field_selector) : null;

	var length = 16; // MsgHeader header
	length += 4; // int32 flags
	length += collection.length + 1; // cstring fullCollectionName
	length += 4; // int32 numberToSkip
	length += 4; // int32 numberToReturn
	length += query.length; // document query
	if (field_selector) {
		length += field_selector.length; // document returnFieldSelector
	}

	var buffer = new Buffer(length);
	var i = this.writeHeader_(buffer, length);

	// int32 flags
	i += this.writeFlags_(buffer, i);

	// cstring fullCollectionName
	i += buffer.write(collection, i, 'utf8');
	buffer[i++] = 0x00;

	// int32 numberToSkip
	var offset = this.offset;
	buffer[i++] = offset & 0xFF;
	buffer[i++] = (offset >> 8) & 0xFF;
	buffer[i++] = (offset >> 16) & 0xFF;
	buffer[i++] = (offset >> 24) & 0xFF;

	// int32 numberToReturn
	var limit = this.limit;
	buffer[i++] = limit & 0xFF;
	buffer[i++] = (limit >> 8) & 0xFF;
	buffer[i++] = (limit >> 16) & 0xFF;
	buffer[i++] = (limit >> 24) & 0xFF;	

	// document query
	i += query.copy(buffer, i);

	// [ document returnFieldSelector ]
	if (field_selector) {
		i += field_selector.copy(buffer, i);
	}

	return buffer;
};


QueryMessage.Flags = {
	TAILABLE_CURSOR: 1,
	SLAVE_OK: 2,
	OPLOG_REPLAY: 3,
	NO_CURSOR_TIMEOUT: 4,
	AWAIT_DATA: 5,
	EXHAUST: 6,
	PARTIAL: 7
};


module.exports = QueryMessage;
