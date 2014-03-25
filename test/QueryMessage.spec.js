
var Message = require('../src/Message');
var QueryMessage = require('../src/QueryMessage');
var Validator = require('./validator.js');


describe('QueryMessage', function () {
	var validateQueryMessage = function (buffer, message) {
		var i = 0;

		i += Validator.validateHeader(buffer, i, Message.OpCodes.OP_QUERY);
		i += Validator.validateFlags(buffer, i);
		i += Validator.validateCString(buffer, i, message.collection);
		i += Validator.validateInt4(buffer, i, 0x00);
		i += Validator.validateInt32(buffer, i, message.offset);
		i += Validator.validateInt32(buffer, i, message.limit);
		i += Validator.validateBson(buffer, i, message.query);

		if (message.field_selector) {
			i += Validator.validateBson(buffer, i, message.field_selector);
		}

		expect(i).to.be(buffer.length);
	};


	it('should build a valid empty message', function () {
		var message = new QueryMessage();
		message.collection = 'test.abc';

		var buffer = message.build();
		validateQueryMessage(buffer, message);
	});


	it('should build a valid message with a query document', function () {
		var message = new QueryMessage();
		message.collection = 'test.abc';
		message.query = { 'name': 'abc' };

		var buffer = message.build();
		validateQueryMessage(buffer, message);
	});


	it('should build a valid message with a field selector', function () {
		var message = new QueryMessage();
		message.collection = 'test.abc';
		message.field_selector = { 'name': 'hij' };

		var buffer = message.build();
		validateQueryMessage(buffer, message);
	});


	it('should build a valid message with a query document and a field selector',
			function () {
		var message = new QueryMessage();
		message.collection = 'test.abc';
		message.query = { 'name': 'abc' };
		message.field_selector = { 'name': 'hij' };

		var buffer = message.build();
		validateQueryMessage(buffer, message);
	});
});
