var events = require('events');
var net = require('net');
var util = require('util');

var Connection = require('../src/Connection');


describe('Connection', function () {
	var __net__Socket = net.Socket;

	var socket;

	var MockSocket = function () {
		socket = this;
		events.EventEmitter.call(this);

		this.connected = false;
		this.connect_allowed_ = true;
	};
	util.inherits(MockSocket, events.EventEmitter);

	MockSocket.prototype.disableConnections = function () {
		this.connect_allowed_ = false;
	};

	MockSocket.prototype.connect = function (port, host, callback) {
		this.port = port;
		this.host = host;

		if (this.connect_allowed_) {
			this.connected = true;
			callback();
		} else {
			this.emit('error', new Error('ECONNREFUSED'));
		}
	};

	MockSocket.prototype.end = function () {
		this.connected = false;
		this.emit('close');
	};


	beforeEach(function () {
		socket = null;

		net.Socket = MockSocket;
	});

	afterEach(function () {
		socket = null;

		net.Socket = __net__Socket;
	});


	it('should open a socket to the mongodb server', function () {
		var server = { host: 'localhost', port: 27017 };
		var connection = new Connection(server);

		connection.open();
		expect(socket.port).to.be(server.port);
		expect(socket.host).to.be(server.host);
	});


	it('should open a socket to the mongodb server', function () {
		var server = { host: 'localhost', port: 27017 };
		var connection = new Connection(server);

		connection.open();
		expect(socket.connected).to.be(true);

		connection.close();
		expect(socket.connected).to.be(false);
	});
});
