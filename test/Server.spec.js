var events = require('events');

var Connection = require('../src/Connection');
var Database = require('../src/Database');
var Server = require('../src/Server');

var MockReplyMessage = require('./MockReplyMessage');
var Validator = require('./validator');


describe('Server', function () {
	var url = 'mongodb://localhost:27017/test';


	it('should say it is not a replica set', function () {
		var server = new Server(url);
		expect(server.isReplicaSet()).to.be(false);
	});


	it('should start as disconnected', function () {
		var server = new Server(url);
		expect(server.isConnected()).to.be(false);
	});


	it('should start as not a primary', function () {
		var server = new Server(url);
		expect(server.isPrimary()).to.be(false);
	});


	it('should return a database', function () {
		var server = new Server(url);

		var database = server.getDatabase('test');
		expect(database).to.be.a(Database);
	});


	describe('connections', function () {
		var __Connection__open = Connection.prototype.open;

		var connection;
		var socket;
		var socket_log = [];

		beforeEach(function () {
			socket = null;
			socket_log = [];

			Connection.prototype.open = function () {
				connection = this;
				socket = new events.EventEmitter();
				socket.write = function (message) {
					socket_log.push(message);
				};

				this.socket_ = socket;
				this.emit('open');
			};
		});

		afterEach(function () {
			socket = null;
			socket_log = null;

			Connection.prototype.open = __Connection__open;
		});


		it('should make a connection', function () {
			var server = new Server(url);

			server.connect(function (conn) {});
			expect(socket).to.be.ok();
		});


		it('should ask whether it is a primary after connecting', function () {
			var server = new Server(url);

			server.connect(function (conn) {});
			expect(socket_log.length).to.be(1);
			expect(socket_log[0]).to.be.a(Buffer);

			var query_message = socket_log[0];
			Validator.validateCommand(query_message, 'ismaster');
		});


		it('should return a connection', function () {
			var server = new Server(url);

			var count = 0;
			server.connect(function (conn) {
				count += 1;
				expect(conn).to.be.a(Connection);
			});

			var response = new MockReplyMessage(socket_log[0]);
			response.addDocument({ 'ismaster': true });

			connection.emit('message', response);
			expect(count).to.be(1);
			expect(server.isPrimary()).to.be(true);
			expect(server.isConnected()).to.be(true);
		});


		it('should not request a new connection if connected', function () {
			var server = new Server(url);
			var first_connection;

			var count = 0;
			server.connect(function (conn) {
				count += 1;
				first_connection = conn;
				expect(conn).to.be.a(Connection);
			});

			var response = new MockReplyMessage(socket_log[0]);
			response.addDocument({ 'ismaster': true });

			connection.emit('message', response);
			expect(count).to.be(1);
			expect(server.isConnected()).to.be(true);

			server.getConnection(function (conn) {
				count += 1;
				expect(conn).to.be(first_connection);
			});
			expect(count).to.be(2);
		});
	});
});
