var Config = require('./config');

module.exports =    {
    init: function (plugin) {

        plugin.views({
            'engines': {
                'handlebars': {
                    'module': require('handlebars')
                }
            },
            'path': './templates'
        });

        plugin.select(['admin', 'mocks']).route({
            'method': '*',
            'path': Config.get('mocksAdminPath'),
            'handler': function(req, res) {

                if (req.payload) {
                    Config.set('enabled', (req.payload.enabled === "true"));
                }
                res.view('index', Config.get());
            }
        });

    }
};
