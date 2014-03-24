
var Collection = require('../src/Collection');
var Command = require('../src/Command');
var Database = require('../src/Database');


describe('Database', function () {
	it('return collection objects', function () {
		var server = {
			isReplicaSet: function () { return false; }
		};

		var database = new Database('test', server);

		var collection = database.getCollection('posts');
		expect(collection).to.be.a(Collection);
		expect(collection.name).to.be('posts');
	});


	describe('connections', function () {
		it('should return a writable connection to a single server', function () {
			var expected_conn = {
				isAuthenticated: function () { return true; }
			};
			var server = {
				isReplicaSet: function () { return false; },
				getConnection: function (callback) {
					callback(expected_conn);
				}
			};

			var database = new Database('test', server);

			var count = 0;
			database.getWritableConnection(function (conn) {
				count += 1;
				expect(conn).to.be(expected_conn);
			});
			expect(count).to.be(1);
		});


		it('should return null if no connection to a single server is available',
				function () {
			var server = {
				isReplicaSet: function () { return false; },
				getConnection: function (callback) {
					callback(null);
				}
			};

			var database = new Database('test', server);

			var count = 0;
			database.getWritableConnection(function (conn) {
				count += 1;
				expect(conn).to.be(null);
			});
			expect(count).to.be(1);
		});


		it('should return a writable connection to a replica set', function () {
			var expected_conn = {
				isAuthenticated: function () { return true; }
			};
			var server = {
				isReplicaSet: function () { return true; },
				getWritableConnection: function (callback) {
					callback(expected_conn);
				}
			};

			var database = new Database('test', server);

			var count = 0;
			database.getWritableConnection(function (conn) {
				count += 1;
				expect(conn).to.be(expected_conn);
			});
			expect(count).to.be(1);
		});


		it('should return null if no connection to a replica set is available',
				function () {
			var server = {
				isReplicaSet: function () { return true; },
				getWritableConnection: function (callback) {
					callback(null);
				}
			};

			var database = new Database('test', server);

			var count = 0;
			database.getWritableConnection(function (conn) {
				count += 1;
				expect(conn).to.be(null);
			});
			expect(count).to.be(1);
		});
	});


	describe('command posting', function () {
		var posted_messages;
		var response;
		var docs;
		var connection;
		var server;

		beforeEach(function () {
			posted_messages = [];
			docs = [];
			response = {
				getDocumentAt: function (doc_index) {
					return docs[doc_index] || null;
				}
			};
			connection = {
				isAuthenticated: function () { return true; },
				postMessage: function (buffer) {
					posted_messages.push(buffer);
				},
				waitForReplyTo: function (request_id, callback) {
					callback(null, response);
				}
			};
			server = {
				isReplicaSet: function () { return false; },
				getConnection: function (callback) {
					callback(connection);
				}
			};
		});


		it('should create database commands', function () {
			var server = {
				isReplicaSet: function () { return false; }
			};

			var database = new Database('test', server);

			var command = database.createCommand('abc', {});
			expect(command).to.be.a(Command);
			expect(command.database).to.be(database.name);
		});


		it('should post commands to the server', function () {
			docs.push({});

			var database = new Database('test', server);
			var command = database.createCommand('abc', {});

			var count = 0;
			database.postCommand(command, function (err, message) {
				count += 1;
				expect(err).to.be(null);
				expect(message).to.be(response);
			});
			expect(count).to.be(1);
			expect(posted_messages.length).to.be(1);
			expect(posted_messages[0]).to.be.a(Buffer);
		});


		it('should report an error from the command response', function () {
			var err_message = 'Damn, what a fabulous error I am';
			docs.push({ 'err': err_message });

			var database = new Database('test', server);
			var command = database.createCommand('abc', {});

			var count = 0;
			database.postCommand(command, function (err, message) {
				count += 1;
				expect(err).to.be.an(Error);
				expect(err.message).to.be(err_message);
				expect(message).to.be(response);
			});
			expect(count).to.be(1);
		});
	});
});
