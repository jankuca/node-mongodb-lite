
var Command = require('../src/Command');


describe('Command', function () {
	it('should build a message', function () {
		var command = new Command('abc', {});
		command.database = 'test';

		var buffer = command.build();
		expect(buffer).to.be.a(Buffer);
	});
});
