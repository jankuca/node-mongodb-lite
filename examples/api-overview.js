var mongodb = require('mongodb-lite');


// The current version of the driver does not support replica sets.
// This is how you connect to a single server (mongod or mongos):
var server = new mongodb.Server('mongodb://localhost:27017');
var db = server.getDatabase('db_name');

// This is how you connect to a replica set (mongod or mongos):
var rs = new mongodb.ReplicaSet('rs_name');
rs.addServer(new mongodb.Server('mongodb://db1.acme.com:27017'));
rs.addServer(new mongodb.Server('mongodb://db2.acme.com:27017'));
var db = rs.getDatabase('db_name');


// Accessing a collection
var collection = db.getCollection('collection_name');


// Storing a new document
var doc = { 'username': 'jankuca', 'created_at': new Date() };
// Non-safe mode
collection.insert(doc);
// Safe mode (wait until the write is propagated to at least 2 nodes)
collection.insert(doc, function (err) {
	if (err) {
		console.error(err.message);
	} else {
		console.log('Document stored');
	}
});


// Getting a document
collection.findOne({ 'username': 'jankuca' }, function (err, doc) {
	if (err) {
		console.error(err);
	} else if (!doc) {
		console.error('No such document');
	} else {
		console.log(doc['_id'].toString(), doc['username']);
	}
});


// Getting multiple documents
var selector = { 'created_at': { '$gt': new Date('2012-09-11') }};
collection.find(selector, function (err, docs) {
	if (err) {
		console.error(err);
	} else if (!docs.length) {
		console.error('No such document');
	} else {
		docs.forEach(function (doc) {
			console.log(doc['_id'].toString(), doc['username']);
		});
	}
});


// Removing a document
// Non-safe mode
collection.remove({ 'username': 'jankuca' });
// Safe mode
collection.remove({ 'username': 'jankuca' }, function (err) {
	if (err) {
		console.error(err);
	} else {
		console.log('Document removed');
	}
});


// Closing the connection to the server
server.close();
// ...or to a whole replica set (future API)
/*
rs.close();
*/
