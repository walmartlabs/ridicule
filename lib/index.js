var Config = require('./config');
var Admin = require('./admin');
var registerMocks = require('./registerMocks');
var path = require('path');
var validate = require('./validate');
var safeHarbor;
var apiCheck;

exports.register = function (plugin, options, next) {

    var apiPrefix;

    Config.init(options);

    // setup the admin page
      Admin.init(plugin);

    // `safeHarbor` is the magic string added as a cookie inside of a handler
    // during bailout. This lets us reroute to the original unprefiexed route 
    // without hitting an infinite loop.
    safeHarbor = Config.get('safeHarbor');

    apiPrefix = [].concat(Config.get('apiPrefix'));

    Config.set('mocksDir', path.resolve(Config.get('mocksDir')));

    Config.set('apiPrefix', apiPrefix.map(function(prefix) {

        // ensure that all slashes are escaped for regex matching
        return prefix.replace(/\//g,'\\/');
    }).join('|'));

    // Regex used to determine if a request should be mocked
    apiCheck = new RegExp('^(' + Config.get('apiPrefix') + ')(.*)');

    // register the onRequest prehandler
    plugin.ext('onRequest', onRequest);
    plugin.ext('onPreResponse', onPreResponse);

    // wire up the actual mocks
    plugin.route(registerMocks(Config));

    next();
};

exports.bailout = function(request, reply) {

    var deregistered = request.url.href.match(new RegExp(Config.get('mocksRouteBase') + '(.*)'));
    reply().state(safeHarbor, '').redirect(deregistered[1]);
};

exports.validate = validate;

// switching logic - determines wether or not to mock out a URL,
// or serve it as normal
function onRequest(req, next) {

    // req.state is not available until after the `onRequest` extention point, so
    // we have to check them on the raw request headers
    var cookies = req.raw.req.headers.cookie;

    if (Config.get('enabled')) {
        // if the random `safeHarbor` string is found in the cookie, we don't want
        // to mock this out.
        if (!cookies || cookies.indexOf(safeHarbor) === -1) {
            var route = req.url.path.match(apiCheck);
            if (route) {
                req.app.ridiculed = true;
                req.setUrl(path.normalize(Config.get('mocksRouteBase') + '/' + route[0]));
            }
        }
    }
    next();
}

// optionally modify the data returned from the mocked response
function onPreResponse(req, next) {

    if (req.app.ridiculed) {
        var data = req.response.source;
        var settings = data && data.ridiculeSettings;

        if (settings) {
            req.response.statusCode = settings.statusCode || 200;
            req.response.source = data.payload;

            Object.keys(settings.headers).forEach(
                function(value, header) {

                    req.response.header(header, value);
            });
        }
    } else if (req.state[safeHarbor] !== undefined) {
        req.response.state(safeHarbor, '', {ttl: -1});
    }

    next();
};
