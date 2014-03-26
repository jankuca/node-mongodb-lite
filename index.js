
var mongodb = {};

mongodb.ReplicaSet = require('./src/ReplicaSet');
mongodb.Server = require('./src/Server');

mongodb.Collection = require('./src/Collection');
mongodb.Command = require('./src/Command');
mongodb.Database = require('./src/Database');

mongodb.ObjectId = require('buffalo').ObjectId;
mongodb.ObjectId.prototype.toJSON = mongodb.ObjectId.prototype.toString;

module.exports = mongodb;
