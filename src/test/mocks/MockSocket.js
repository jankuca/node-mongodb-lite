var events = require('events');
var util = require('util');


/**
 * @constructor
 * @extends {events.EventEmitter}
 */
var MockSocket = function () {
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


module.exports = MockSocket;
