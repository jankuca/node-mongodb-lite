
var Message = require('../src/Message');
var InsertMessage = require('../src/InsertMessage');
var Validator = require('./validator.js');


describe('InsertMessage', function () {
	var validateInsertMessage = function (buffer, message) {
		var i = 0;

		i += Validator.validateHeader(buffer, i, Message.OpCodes.OP_INSERT);
		i += Validator.validateFlags(buffer, i);
		i += Validator.validateCString(buffer, i, message.collection);
		i += Validator.validateInt4(buffer, i, 0x00);

		message.getAllDocuments().forEach(function (document) {
			i += Validator.validateBson(buffer, i, document);
		});

		expect(i).to.be(buffer.length);
	};


	it('should build a valid empty message', function () {
		var message = new InsertMessage();
		message.collection = 'test.abc';

		var buffer = message.build();
		validateInsertMessage(buffer, message);
	});


	it('should build a valid message with a document', function () {
		var message = new InsertMessage();
		message.collection = 'test.abc';
		message.addDocument({ 'name': 'abc' });

		var buffer = message.build();
		validateInsertMessage(buffer, message);
	});


	it('should build a valid message with multiple documents', function () {
		var message = new InsertMessage();
		message.collection = 'test.abc';
		message.addDocument({ 'name': 'abc' });
		message.addDocument({ 'name': 'efg' });
		message.addDocument({ 'name': 'hij' });

		var buffer = message.build();
		validateInsertMessage(buffer, message);
	});
});
