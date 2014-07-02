var _ = require('underscore'),
    Path = require("path");

module.exports = function (Config) {

    var registeredRoutes = require(Path.resolve(Config.get("mocksDir")) + "/ridicule");

    return registeredRoutes.map(function (route) {

        return _.defaults({
            path: Config.get("mocksRouteBase") + route.path
        }, route);
    });
};
