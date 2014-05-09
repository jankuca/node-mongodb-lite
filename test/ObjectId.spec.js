
var mongodb = require('../');

describe('mongodb.ObjectId', function () {
  it('should serialize to JSON as a string', function () {
    var id = new mongodb.ObjectId();
    expect(JSON.stringify(id)).to.be('"' + String(id) + '"');
  });


  it('should determine whether an object is an ObjectId', function () {
    var id = new mongodb.ObjectId();
    expect(mongodb.ObjectId.isObjectId(id)).to.be(true);
  });


  it('should determine whether a null is an ObjectId', function () {
    expect(mongodb.ObjectId.isObjectId(null)).to.be(false);
  });


  it('should determine whether a custom object is an ObjectId', function () {
    var real_id = new mongodb.ObjectId();

    var obj = {};
    var fake_id = {
      bytes: real_id.bytes,
      toString: function () { return this.bytes.toString('hex'); },
      toJSON: function () { return this.toString(); }
    };

    expect(mongodb.ObjectId.isObjectId(obj)).to.be(false);
    expect(mongodb.ObjectId.isObjectId(fake_id)).to.be(true);
  });
});
