var Config = require('../lib/config'),
    expect = require('chai').expect,
    hapi = require('hapi'),
    Path = require('path'),
    Plugin = require('../');

describe('ridicule', function() {

  var server;

  beforeEach(function(done) {

    server = new hapi.Server(undefined, 0, {labels: ['api']});
    server.route([
      {
        method: 'GET',
        path: '/j/foo',
        handler: function(request, reply) {
          reply('This is the real deal');
        }
      },
      {
        method: 'GET',
        path: '/j/bail',
        handler: function(request, reply) {
          reply((request.query.foo || '') + 'This is the real deal, too')
              .header('x-foo', 'bar');
        }
      }
    ]);

    server.start(function() {

      server.pack.register({
          name: 'foo',
          version: '1.0.0',
          register: Plugin.register
        },
        {
          enabled: false,
          mocksAdminServerLabels: 'admin',
          mocksAdminPath: '/mocks',

          mocksDir: 'test/mocks',
          apiPrefix: [
            '/api/', '/j'
          ]
        },
        function() {
          done();
        });
    });
  });

  it('should setup config environment', function() {

    expect(Config.get('mocksDir')).to.equal(Path.resolve('.') + '/test/mocks');
    expect(Config.get('apiPrefix')).to.equal('\\/api\\/|\\/j');
  });

  it('should load ridiculed paths', function() {

    var table = server.table().map(function(route) {

      var settings = route.settings;
      return {
        method: settings.method,
        path: settings.path
      };
    });

    expect(table).to.eql([
      {
        method: 'get',
        path: '/j/foo'
      },
      {
        method: 'get',
        path: '/j/bail'
      },
      {
        method: 'get',
        path: Config.get('mocksRouteBase') + '/j/foo'
      },
      {
        method: 'get',
        path: Config.get('mocksRouteBase') + '/j/bail'
      },
      {
        method: 'get',
        path: Config.get('mocksRouteBase') + '/j/complex'
      },
      {
        method: 'get',
        path: Config.get('mocksRouteBase') + '/j/missing-bail'
      }
    ]);
  });

  it('should mock requests when enabled via config', function(done) {

    Config.set('enabled', true);

    server.inject({url: '/j/foo'}, function(res) {

      expect(res.payload).to.equal('This is mocked');
      done();
    });
  });

  it('should mock requests when enabled via cookie', function(done) {

    Config.set('enabled', false);

    server.inject({url: '/j/foo', headers: {cookie: 'always_ridicule=true'}}, function(res) {

      expect(res.payload).to.equal('This is mocked');
      done();
    });
  });

  it('should leave non-mocked untouched due to config', function(done) {

    Config.set('enabled', false);

    server.inject({url: '/j/foo'}, function(res) {

      expect(res.payload).to.equal('This is the real deal');
      done();
    });
  });

  it('should leave non-mocked untouched due to cookie', function(done) {

    Config.set('enabled', true);

    server.inject({url: '/j/foo', headers: {cookie: 'always_ridicule=false'}}, function(res) {

      expect(res.payload).to.equal('This is the real deal');
      done();
    });
  });

  it('should proxy requests on bailout', function(done) {

    Config.set('enabled', true);

    server.inject({url: '/j/bail', headers: {cookie: 'always_ridicule=true'}}, function(res) {

      expect(res.payload).to.equal('This is the real deal, too');
      expect(res.headers['x-foo']).to.equal('bar');

      done();
    });
  });

  it('should proxy requests on bailout with parameters', function(done) {

    Config.set('enabled', true);

    server.inject({url: '/j/bail?foo=bar', headers: {cookie: 'always_ridicule=true'}}, function(res) {

      expect(res.payload).to.equal('barThis is the real deal, too');
      expect(res.headers['x-foo']).to.equal('bar');

      done();
    });
  });

  it('should mock complex responses', function(done) {

    Config.set('enabled', true);

    server.inject({url: '/j/complex'}, function(res) {

      expect(res.payload).to.equal('This is mocked');
      expect(res.statusCode).to.equal(500);
      expect(res.headers.foo).to.equal('bar');

      done();
    });
  });

  it('should mock complex json responses', function(done) {

    Config.set('enabled', true);

    server.inject({url: '/j/complex?json=1'}, function(res) {

      expect(JSON.parse(res.payload)).to.eql({mock: true});
      expect(res.statusCode).to.equal(200);

      done();
    });
  });

  it('should fails on missing requests for bailout', function(done) {

    Config.set('enabled', true);

    server.inject({url: '/j/missing-bail', headers: {cookie: 'always_ridicule=true'}}, function(res) {

      expect(res.statusCode).to.equal(404);

      done();
    });
  });
});
