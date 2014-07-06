var Config = require('../lib/config'),
    expect = require('chai').expect,
    hapi = require('hapi'),
    Plugin = require('../lib');

describe('cookie setter endpoints', function() {

  var server;

  describe('view', function() {

    it('should return enabled view', function(done) {

      server = new hapi.Server(undefined, 0);

      server.start(function() {

        server.pack.register({
          name: 'foo',
          version: '1.0.0',
          register: function(plugin, options, next) {

            var noopNext = function(){};

            Plugin.register(plugin, options, noopNext);
            next();
          }
        },
        {
          enabled: false,
          enableForceCookiePage: true,
          mocksDir: 'test/mocks'
        },
        function() {

          server.inject({url: '/cookie'}, function(res) {

            expect(res.payload).to.match(/add force-mock cookie/);
            done();
          });
        });
      });

    });

    it('should 404 when disabled', function(done) {

      server = new hapi.Server(undefined, 0);

      server.start(function() {

        server.pack.register({
          name: 'foo',
          version: '1.0.0',
          register: function(plugin, options, next) {

            var noopNext = function(){};

            Plugin.register(plugin, options, noopNext);
            next();
          }
        },
        {
          enabled: false,
          mocksDir: 'test/mocks'
        },
        function() {

          server.inject({url: '/cookie'}, function(res) {

            expect(res.statusCode).to.equal(404);
            done();
          });
        });
      });

    });

  });

});
