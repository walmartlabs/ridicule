var path = require('path');

module.exports = function(Config) {

    var registeredRoutes = require(path.resolve(Config.get('mocksDir')) + '/ridicule');

    registeredRoutes.map(function(route) {

        route.path = Config.get('mocksRouteBase') + route.path;
    });

    return registeredRoutes;
};
