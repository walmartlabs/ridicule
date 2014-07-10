var Config = require('./config');

module.exports = {
    init: function (plugin) {

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
