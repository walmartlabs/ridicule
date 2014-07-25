var LogErr = require('../lib/error'),
    expect = require('chai').expect;

describe('error logger', function() {
  var _error;

  before(function() {
    _error = console.error;
    console.error = function() {
      return Array.prototype.slice.call(arguments, 0).join(' ');
    };
  });

  after(function() {
    console.error = _error;
  });

  describe('view', function() {

    it('should return a red colored error message', function() {

        expect(LogErr('foo')).to.equal('\u001b[31mridicule: foo\u001b[39m');
    });

  });
});
