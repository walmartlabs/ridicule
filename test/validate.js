var Config = require('../lib/config'),
    expect = require('chai').expect,
    hapi = require('hapi'),
    sinon = require('sinon'),
    validate = require('../lib/validate');

describe('validate helper', function() {
  it('should handle no validator', function(done) {
    var request = {},
        reply = sinon.spy();

    expect(validate(request, reply, {
      callback: function(_request, _reply) {
        expect(reply.callCount).to.equal(0);

        expect(_request).to.equal(request);
        expect(_reply).to.equal(reply);
        done();
      }
    })).to.equal(true);
  });
  it('should handle no validator or callback', function() {
    var reply = sinon.spy();

    expect(validate({}, reply, {})).to.equal(true);
    expect(reply.callCount).to.equal(0);
  });
  it('should handle true validator and no callback', function() {
    var reply = sinon.spy();

    expect(validate({}, reply, {validator: true})).to.equal(true);
    expect(reply.callCount).to.equal(0);
  });

  it('should match no validator and query parameters', function() {
    var request = {
          query: {
            foo: 'bar'
          }
        },
        reply = sinon.spy();

    expect(validate(request, reply, {
      callback: function(_request, _reply) {
        throw new Error('It failed');
      }
    })).to.not.exist;
    expect(reply.callCount).to.equal(0);
  });

  it('should match query parameters', function(done) {
    var request = {
          query: {
            foo: 'bar',
            bat: 'baz',
            bak: undefined,
            bot: 'bat'
          }
        },
        reply = sinon.spy();

    expect(validate(request, reply, {
      validator: {
        foo: true,
        bat: 'baz',
        bak: function() { return true; },
        bot: /b.t/,
        notHere: true
      },
      callback: function(_request, _reply) {
        expect(reply.callCount).to.equal(0);

        expect(_request).to.equal(request);
        expect(_reply).to.equal(reply);
        done();
      }
    })).to.equal(true);
  });
  it('should return falsey for invalidated parameters', function() {
    var request = {
          query: {
            foo: 'bar',
            bat: 'baz',
            bak: undefined,
            bot: 'bat'
          }
        },
        reply = sinon.spy();

    expect(validate(request, reply, {
      validator: {
        foo: true,
        bat: 'baz',
        bak: function() { return true; },
        bot: /b.z/,
        notHere: true
      },
      callback: function(_request, _reply) {
        throw new Error('Failed');
      }
    })).to.equal(undefined);
    expect(reply.callCount).to.equal(0);
  });
});
