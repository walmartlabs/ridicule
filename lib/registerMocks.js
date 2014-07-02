var _defaults = require('lodash.defaults'),
    Path = require('path');

module.exports = function (Config) {

    var registeredRoutes = require(Path.resolve(Config.get('mocksDir')) + '/ridicule');

    return registeredRoutes.map(function (route) {

        return _defaults({
            path: Config.get('mocksRouteBase') + route.path
        }, route);
    });
};
