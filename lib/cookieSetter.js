var Config = require('./config');

module.exports = {
    init: function (plugin) {

        plugin.route({
          'method': 'GET',
          'path': '/cookie',
          'handler': function (request, reply) {

            reply.view('cookieSetter', Config.get());
          }
        });
    }
};
