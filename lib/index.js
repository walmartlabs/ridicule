var Config = require("./config");
var Admin = require("./admin");
var RegisterMocks = require("./registerMocks");
var Path = require("path");
var Validate = require("./validate");
var internals = {};

exports.register = function (plugin, options, next) {

    var apiPrefix;

    Config.init(options);

    // Setup the admin page
    Admin.init(plugin);

    // `safeHarbor` is the magic string added as a cookie inside of a handler during bailout. This lets us reroute to the original unprefiexed route
    // without hitting an infinite loop.
    internal.safeHarbor = Config.get("safeHarbor");

    apiPrefix = [].concat(Config.get("apiPrefix"));

    Config.set("mocksDir", Path.resolve(Config.get("mocksDir")));

    Config.set("apiPrefix", apiPrefix.map(function (prefix) {

        // Ensure that all slashes are escaped for regex matching
        return prefix.replace(/\//g, "\\/");
    }).join("|"));

    // Regex used to determine if a request should be mocked
    internals.apiCheck = new RegExp("^(" + Config.get("apiPrefix") + ")(.*)");

    // Register the onRequest prehandler
    plugin.ext("onRequest", onRequest);
    plugin.ext("onPreResponse", onPreResponse);

    // Wire up the actual mocks
    plugin.route(RegisterMocks(Config));

    next();
};


exports.bailout = function (request, reply) {

    var deregistered = request.url.href.match(new RegExp(Config.get("mocksRouteBase") + "(.*)"));
    reply().state(internals.safeHarbor, "").redirect(deregistered[1]);
};


exports.validate = Validate;

// Switching logic - determines wether or not to mock out a URL, or serve it as normal
var onRequest = function (req, next) {

    // `req.state` is not available until after the `onRequest` extention point, so we have to check them on the raw request headers
    var cookies = req.raw.req.headers.cookie;

    if (Config.get("enabled")) {
        // If the random `safeHarbor` string is found in the cookie, we don't want to mock this out.
        if (!cookies || cookies.indexOf(internals.safeHarbor) === -1) {
            var route = req.url.path.match(internals.apiCheck);
            if (route) {
                req.app.ridiculed = true;
                req.setUrl(Path.normalize(Config.get("mocksRouteBase") + "/" + route[0]));
            }
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

            Object.keys(settings.headers).forEach(function (value, header) {

                req.response.header(header, value);
            });
        }
    } else if (req.state[internals.safeHarbor] !== undefined) {
        req.response.state(internals.safeHarbor, "", { ttl: -1 });
    }

    next();
};
