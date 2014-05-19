var Config = require("./config");
var Admin = require("./admin");
var Bailout = require("./bailout");
var RegisterMocks = require("./registerMocks");
var Path = require("path");
var Validate = require("./validate");
var internals = {};

exports.register = function (plugin, options, next) {

    var apiPrefix;

    Config.init(options);

    // Setup the admin page
    Admin.init(plugin);

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


exports.bailout = Bailout;

exports.validate = Validate;

// Switching logic - determines wether or not to mock out a URL, or serve it as normal
var onRequest = function (req, next) {

    var route = req.url.path.match(internals.apiCheck);

    if (route && !('x-dontridicule' in req.headers)) {
        req.app.ridiculed = true;
        req.setUrl(Path.normalize(Config.get("mocksRouteBase") + "/" + route[0]));
    } else {
        delete req.headers['x-dontridicule'];
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
    }

    next();
};
