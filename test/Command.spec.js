
var Command = require('../src/Command');


describe('Command', function () {
	it('should build a message', function () {
		var command = new Command('abc', {});
		command.database = 'test';

		var buffer = command.build();
		expect(buffer).to.be.a(Buffer);
	});


  it('should return a normalized action', function () {
    var command = new Command('abc');
    expect(command.getAction()).to.eql({ 'abc': 1 });
  });


  it('should return a normalized action with a collection name', function () {
    var command = new Command({ 'abc': 'xyz' });
    expect(command.getAction()).to.eql({ 'abc': 'xyz' });
  });


  it('should return a collection name', function () {
    var command = new Command({ 'abc': 'xyz' });
    expect(command.getCollectionName()).to.be('xyz');
  });


  it('should return null when the collection name is not known', function () {
    var command = new Command('abc');
    expect(command.getCollectionName()).to.be(null);
  });


  it('should return a param value', function () {
    var command = new Command('abc', { 'x': 'abc', 'y': 'efg' });
    expect(command.getParam('x')).to.be('abc');
    expect(command.getParam('y')).to.be('efg');
  });


  it('should return null when a param is not provided', function () {
    var command = new Command('abc', { 'x': 'abc' });
    expect(command.getParam('y')).to.be(null);
  });


  it('should return null when no param is provided', function () {
    var command = new Command('abc');
    expect(command.getParam('x')).to.be(null);
  });
});
