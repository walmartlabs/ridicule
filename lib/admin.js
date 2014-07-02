var Handlebars = require('handlebars');
var Config = require('./config');

module.exports = {
    init: function (plugin) {

        plugin.views({
            'engines': {
                'handlebars': {
                    'module': Handlebars
                }
            },
            'path': './templates'
        });

        plugin.select(Config.get('mocksAdminServerLabels')).route([
            {
                'method': 'GET',
                'path': Config.get('mocksAdminPath'),
                'handler': function (request, reply) {

                    reply.view('index', Config.get());
                }
            },
            {
                'method': 'POST',
                'path': Config.get('mocksAdminPath'),
                'handler': function (request, reply) {

                    Config.set('enabled', request.payload.enabled === 'true');
                    reply().redirect(Config.get('mocksAdminPath'));
                }
            }
        ]);
    }
};
