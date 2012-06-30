
var mongodb = {};

mongodb.ReplicaSet = require('./src/ReplicaSet');
mongodb.Server = require('./src/Server');

mongodb.ObjectId = require('buffalo').ObjectId;
mongodb.ObjectId.prototype.toJSON = mongodb.ObjectId.prototype.toString;

module.exports = mongodb;
