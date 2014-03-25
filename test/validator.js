var buffalo = require('buffalo');

var Message = require('../src/Message');


var Validator = {};

Validator.validateHeader = function (buffer, i, op_code) {
	i = i || 0;
	i += Validator.validateInt32(buffer, i, buffer.length);
	i += 4; // requestID
	i += 4; // responseTo
	if (op_code) {
		i += Validator.validateInt32(buffer, i, op_code);
	} else {
		i += 4;
	}
	return i;
};

Validator.validateInt4 = function (buffer, i, expected) {
	expect(buffer[i++]).to.be(expected & 0xFF);
	return 1;
};

Validator.validateInt32 = function (buffer, i, expected) {
	expect(buffer[i++]).to.be(expected & 0xFF);
	expect(buffer[i++]).to.be((expected >> 8) & 0xFF);
	expect(buffer[i++]).to.be((expected >> 16) & 0xFF);
	expect(buffer[i++]).to.be((expected >> 24) & 0xFF);
	return 4;
};

Validator.validateFlags = function (buffer, i, expected) {
	return 4;
};

Validator.validateCString = function (buffer, i, expected) {
	var str_length = new Buffer(expected).length;
	var str_buffer = buffer.slice(i, i += str_length);
	expect(str_buffer.toString()).to.be(expected);
	return str_length;
};

Validator.validateBson = function (buffer, i, expected) {
	var bson_length = buffalo.serialize(expected).length;
	var bson = buffer.slice(i, i += bson_length);
	expect(buffalo.parse(bson)).to.eql(expected);
	return bson_length;
};


Validator.validateCommand = function (buffer, action, params) {
	var i = 0;

	i += Validator.validateHeader(buffer, i, Message.OpCodes.OP_QUERY);
	i += Validator.validateFlags(buffer, i);
	i += Validator.validateCString(buffer, i, 'db.$cmd');
	i += Validator.validateInt4(buffer, i, 0x00);
	i += Validator.validateInt32(buffer, i, 0);
	i += Validator.validateInt32(buffer, i, 0xFFFFFFFF);

	var query = {};
	query[action] = 1;

	Object.keys(params || {}).forEach(function (key) {
		query[key] = params[key];
	});

	i += Validator.validateBson(buffer, i, query);

	expect(i).to.be(buffer.length);
};


module.exports = Validator;
