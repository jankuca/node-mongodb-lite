
var mongodb = {};

mongodb.ReplicaSet = require('./src/ReplicaSet');
mongodb.Server = require('./src/Server');

mongodb.ObjectId = require('buffalo').ObjectId;

module.exports = mongodb;
