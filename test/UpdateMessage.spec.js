
var Message = require('../src/Message');
var UpdateMessage = require('../src/UpdateMessage');
var Validator = require('./validator.js');


describe('UpdateMessage', function () {
	var validateUpdateMessage = function (buffer, message) {
		var i = 0;

		i += Validator.validateHeader(buffer, i, Message.OpCodes.OP_UPDATE);
		i += Validator.validateInt32(buffer, i, 0);
		i += Validator.validateCString(buffer, i, message.collection);
		i += Validator.validateInt4(buffer, i, 0x00);
		i += Validator.validateFlags(buffer, i);
		i += Validator.validateBson(buffer, i, message.selector);
		i += Validator.validateBson(buffer, i, message.document);

		expect(i).to.be(buffer.length);
	};


	it('should build a valid empty message', function () {
		var message = new UpdateMessage();
		message.collection = 'test.abc';

		var buffer = message.build();
		validateUpdateMessage(buffer, message);
	});


	it('should build a valid message with selector', function () {
		var message = new UpdateMessage();
		message.collection = 'test.abc';
		message.selector = { 'name': 'abc' };

		var buffer = message.build();
		validateUpdateMessage(buffer, message);
	});


	it('should build a valid message with document', function () {
		var message = new UpdateMessage();
		message.collection = 'test.abc';
		message.document = { 'name': 'efg' };

		var buffer = message.build();
		validateUpdateMessage(buffer, message);
	});


	it('should build a valid message with selector and document', function () {
		var message = new UpdateMessage();
		message.collection = 'test.abc';
		message.selector = { 'name': 'abc' };
		message.document = { 'name': 'efg' };

		var buffer = message.build();
		validateUpdateMessage(buffer, message);
	});
});
