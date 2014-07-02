var _ = require('underscore'),
    Cookie = require("cookie"),
    Path = require("path"),
    Config = require("./config"),
    Admin = require("./admin"),
    Bailout = require("./bailout"),
    RegisterMocks = require("./registerMocks"),
    Validate = require("./validate");

var apiCheck;

exports.register = function (plugin, options, next) {

    var apiPrefix;

    Config.init(options);

    // Setup the admin page
    Admin.init(plugin);

    // Concated wtth an empty array so we can handle strings as well as other arrays
    apiPrefix = [].concat(Config.get("apiPrefix"));

    Config.set("mocksDir", Path.resolve(Config.get("mocksDir")));

    Config.set("apiPrefix", apiPrefix.map(function (prefix) {

        // Ensure that all slashes are escaped for regex matching
        return prefix.replace(/\//g, "\\/");
    }).join("|"));

    // Regex used to determine if a request should be mocked
    apiCheck = new RegExp("^(" + Config.get("apiPrefix") + ")(.*)");

    // Register the onRequest prehandler
    plugin.ext("onRequest", onRequest);
    plugin.ext("onPreResponse", onPreResponse);

    // Wire up the actual mocks
    plugin.route(RegisterMocks(Config));

    next();
};

exports.register.attributes = {

    pkg: require('../package.json')
};


exports.bailout = Bailout;

exports.validate = Validate;

// Switching logic - determines wether or not to mock out a URL, or serve it as normal
var onRequest = function (req, next) {
    // Cookies are normally accessed from `req.state`, but they're not set at this
    // point in the request cycle
    var cookies = Cookie.parse(req.raw.req.headers.cookie || '');
    var enable = Config.get("enabled") || cookies.always_ridicule === 'true';
    var disabled = cookies.always_ridicule === 'false';
    var route;

    if (enable && !disabled) {
        route = req.url.path.match(apiCheck);

        if (route && !('x-dontridicule' in req.headers)) {
            req.app.ridiculed = true;
            req.setUrl(Path.normalize(Config.get("mocksRouteBase") + "/" + route[0]));
        } else {
            delete req.headers['x-dontridicule'];
        }

    }

    next();
};


// Optionally modify the data returned from the mocked response
var onPreResponse = function (req, next) {

    if (req.app.ridiculed) {
        var data = req.response.source;
        var settings = data && data.ridiculeSettings;

        if (settings) {
            req.response.statusCode = settings.statusCode || 200;
            req.response.source = data.payload;

            if (typeof data.payload === 'string') {
                req.response.settings.stringify = null;
                req.response.type('text/html');
            }

            _.each(settings.headers, function (value, name) {

                req.response.header(name, value);
            });
        }
    }

    next();
};
