var Config = require('../lib/config'),
    expect = require('chai').expect,
    hapi = require('hapi'),
    Plugin = require('../lib/admin');

describe('admin endpoints', function() {
  var server;
  beforeEach(function(done) {
    server = new hapi.Server(undefined, 0, {labels: ['admin']});

    server.start(function() {
      server.pack.register({
          name: 'foo',
          version: '1.0.0',
          register: function(plugin, options, next) {
            Config.init(options);
            Plugin.init(plugin);
            next();
          }
        },
        {
          enabled: false,
          mocksAdminServerLabels: 'admin',
          mocksAdminPath: '/mocks'
        },
        function() {
          done();
        });
    });
  });

  describe('view', function() {
    it('should return enabled view', function(done) {
      Config.set('enabled', true);

      server.inject({url: '/mocks'}, function(res) {
        expect(res.payload).to.match(/Mocks Enabled:\s*True/);
        done();
      });
    });
    it('should return disabled view', function(done) {
      Config.set('enabled', false);

      server.inject({url: '/mocks'}, function(res) {
        expect(res.payload).to.match(/Mocks Enabled:\s*False/);
        done();
      });
    });
  });

  describe('POST', function() {
    it('should enabled mocking', function(done) {
      Config.set('enable', false);

      server.inject({method: 'post', url: '/mocks', payload: {enabled: 'true'}}, function(res) {
        expect(res.headers.location).to.match(/\/mocks$/);
        expect(Config.get('enabled')).to.equal(true);
        done();
      });
    });
    it('should disable mocking', function(done) {
      Config.set('enabled', false);

      server.inject({method: 'post', url: '/mocks', payload: {enabled: 'false'}}, function(res) {
        expect(res.headers.location).to.match(/\/mocks$/);
        expect(Config.get('enabled')).to.equal(false);
        done();
      });
    });
  });
});
