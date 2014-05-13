
var mongodb = {};

mongodb.ReplicaSet = require('./src/ReplicaSet');
mongodb.Server = require('./src/Server');
mongodb.Connection = require('./src/Connection');

mongodb.Collection = require('./src/Collection');
mongodb.Command = require('./src/Command');
mongodb.Database = require('./src/Database');

mongodb.DeleteMessage = require('./src/DeleteMessage');
mongodb.InsertMessage = require('./src/InsertMessage');
mongodb.Message = require('./src/Message');
mongodb.QueryMessage = require('./src/QueryMessage');
mongodb.ReplyMessage = require('./src/ReplyMessage');
mongodb.UpdateMessage = require('./src/UpdateMessage');


mongodb.bson = require('buffalo');

mongodb.ObjectId = mongodb.bson.ObjectId;
mongodb.ObjectId.prototype.toJSON = mongodb.ObjectId.prototype.toString;

mongodb.ObjectId.isObjectId = function (id) {
  if (typeof id === 'object' && id !== null && id.bytes) {
    var value = String(id);
    return (mongodb.ObjectId.prototype.toString.call(id) === value);
  }
  return false;
};


module.exports = mongodb;
