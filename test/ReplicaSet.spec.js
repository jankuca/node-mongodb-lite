
var Database = require('../src/Database');
var ReplicaSet = require('../src/ReplicaSet');


describe('ReplicaSet', function () {
	it('should say it is a replica set', function () {
		var rs = new ReplicaSet('rs1');
		expect(rs.isReplicaSet()).to.be(true);
	});


	it('should return a database', function () {
		var rs = new ReplicaSet('rs1');

		var database = rs.getDatabase('test');
		expect(database).to.be.a(Database);
	});


	describe('connections', function () {
		var MockServer = function (state) {
			this.state = state || {};
			this.counts = {
				connect: 0,
				getConnection: 0
			};

			if (this.isConnected()) {
				this.state.connection = {};
			}
		};

		MockServer.prototype.connect = function (callback) {
			this.counts.connect += 1;
			this.state.connected = true;
			this.state.connection = {};
			if (callback) {
				callback();
			}
		};

		MockServer.prototype.isConnected = function () {
			return Boolean(this.state.connected);
		};

		MockServer.prototype.isPrimary = function () {
			return Boolean(this.state.primary);
		};

		MockServer.prototype.getConnection = function (callback) {
			this.counts.getConnection += 1;
			callback(this.state.connection || null);
		};


		it('should accept servers', function () {
			var rs = new ReplicaSet('rs1');

			rs.addServer(new MockServer());
			rs.addServer(new MockServer());
		});


		it('should connect to all the servers', function () {
			var rs = new ReplicaSet('rs1');

			var server1 = new MockServer();
			var server2 = new MockServer();
			var server3 = new MockServer();
			rs.addServer(server1);
			rs.addServer(server2);
			rs.addServer(server3);

			var count = 0;
			rs.connect(function () {
				count += 1;
			});
			expect(count).to.be(1);
			expect(server1.counts.connect).to.be(1);
			expect(server2.counts.connect).to.be(1);
			expect(server3.counts.connect).to.be(1);
		});


		it('should fail on connect when no servers are specified', function () {
			var rs = new ReplicaSet('rs1');

			expect(function () {
				rs.connect(function () {});
			}).to.throwError('No replica set servers specified');
		});


		it('should only connect to disconnected servers', function () {
			var rs = new ReplicaSet('rs1');

			var server1 = new MockServer();
			var server2 = new MockServer({ connected: true });
			var server3 = new MockServer();
			rs.addServer(server1);
			rs.addServer(server2);
			rs.addServer(server3);

			var count = 0;
			rs.connect(function () {
				count += 1;
			});
			expect(count).to.be(1);
			expect(server1.counts.connect).to.be(1);
			expect(server2.counts.connect).to.be(0);
			expect(server3.counts.connect).to.be(1);
		});


		it('should get a writable connection from the primary', function () {
			var rs = new ReplicaSet('rs1');

			var server1 = new MockServer();
			var server2 = new MockServer({ connected: true, primary: true });
			var server3 = new MockServer();
			rs.addServer(server1);
			rs.addServer(server2);
			rs.addServer(server3);

			var count = 0;
			rs.getWritableConnection(function (conn) {
				count += 1;
				expect(conn).to.be(server2.state.connection);
			});
			expect(count).to.be(1);
			expect(server1.counts.connect).to.be(1);
			expect(server2.counts.connect).to.be(0);
			expect(server2.counts.getConnection).to.be(1);
			expect(server3.counts.connect).to.be(1);
		});


		it('should get a writable connection from a newly elected primary',
				function () {
			var rs = new ReplicaSet('rs1');

			var server1 = new MockServer();
			var server2 = new MockServer({ connected: true, primary: true });
			var server3 = new MockServer();
			rs.addServer(server1);
			rs.addServer(server2);
			rs.addServer(server3);

			var count = 0;
			rs.getWritableConnection(function (conn) {
				count += 1;
				expect(conn).to.be(server2.state.connection);
			});
			expect(count).to.be(1);
			expect(server1.counts.connect).to.be(1);
			expect(server2.counts.connect).to.be(0);
			expect(server2.counts.getConnection).to.be(1);
			expect(server3.counts.connect).to.be(1);

			server2.state.connected = false;
			server2.state.connection = null;
			server2.state.primary = false;
			server3.state.primary = true;
			rs.getWritableConnection(function (conn) {
				count += 1;
				expect(conn).to.be(server3.state.connection);
			});
			expect(count).to.be(2);
			expect(server1.counts.connect).to.be(1);
			expect(server2.counts.connect).to.be(1);
			expect(server2.counts.getConnection).to.be(1);
			expect(server3.counts.connect).to.be(1);
			expect(server3.counts.getConnection).to.be(1);
		});
	});
});
