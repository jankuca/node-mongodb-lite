
var Message = require('../src/Message');
var DeleteMessage = require('../src/DeleteMessage');
var Validator = require('./validator.js');


describe('DeleteMessage', function () {
	var validateDeleteMessage = function (buffer, message) {
		var i = 0;

		i += Validator.validateHeader(buffer, i, Message.OpCodes.OP_DELETE);
		i += Validator.validateInt32(buffer, i, 0);
		i += Validator.validateCString(buffer, i, message.collection);
		i += Validator.validateInt4(buffer, i, 0x00);
		i += Validator.validateFlags(buffer, i);
		i += Validator.validateBson(buffer, i, message.selector);

		expect(i).to.be(buffer.length);
	};


	it('should build a valid empty message', function () {
		var message = new DeleteMessage();
		message.collection = 'test.abc';

		var buffer = message.build();
		validateDeleteMessage(buffer, message);
	});


	it('should build a valid message with a selector', function () {
		var message = new DeleteMessage();
		message.collection = 'test.abc';
		message.selector = { 'name': 'abc' };

		var buffer = message.build();
		validateDeleteMessage(buffer, message);
	});
});
