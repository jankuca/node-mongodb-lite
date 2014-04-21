
var Connection = require('../src/Connection');

var MockSocket = require('../src/test/mocks/MockSocket');


describe('Connection', function () {
	var server;
	var socket;

	beforeEach(function () {
		server = {
			host: 'localhost',
			port: 27017,
			createSocket: function () {
				socket = new MockSocket();
				return socket;
			}
		};
	});


	it('should open a socket to the mongodb server', function () {
		var connection = new Connection(server);

		connection.open();
		expect(socket.port).to.be(server.port);
		expect(socket.host).to.be(server.host);
	});


	it('should open a socket to the mongodb server', function () {
		var connection = new Connection(server);

		connection.open();
		expect(socket.connected).to.be(true);

		connection.close();
		expect(socket.connected).to.be(false);
	});
});
