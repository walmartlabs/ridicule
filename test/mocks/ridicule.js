var Ridicule = require('../../lib');

module.exports = [
  {
    method: 'GET',
    path: '/j/foo',
    handler: function(request, reply) {
      reply('This is mocked');
    }
  },
  {
    method: 'GET',
    path: '/j/complex',
    handler: function(request, reply) {
      if (request.query.json) {
        reply({
          ridiculeSettings: {},
          payload: {
            mock: true
          }
        });
      } else {
        reply({
          ridiculeSettings: {
            statusCode: 500,
            headers: {
              'foo': 'bar'
            }
          },
          payload: 'This is mocked'
        });
      }
    }
  },
  {
    method: 'GET',
    path: '/j/bail',
    handler: function(request, reply) {
      Ridicule.bailout(request, reply);
    }
  },
  {
    method: 'GET',
    path: '/j/missing-bail',
    handler: function(request, reply) {
      Ridicule.bailout(request, reply);
    }
  }
];
