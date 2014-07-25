var _defaults = require('lodash.defaults'),
    Fs = require('fs'),
    LogErr = require('./error'),
    Path = require('path');

module.exports = function (Config) {

    var ridiculeFile = Path.resolve(Config.get('mocksDir')) + '/ridicule.js',
    registeredRoutes;

    if (Fs.existsSync(ridiculeFile)) {
      registeredRoutes = require(ridiculeFile);
    } else {
      LogErr(ridiculeFile + ' does not exist, no mocks registered');
      registeredRoutes = [];
    }

    return registeredRoutes.map(function (route) {

        return _defaults({
            path: Config.get('mocksRouteBase') + route.path
        }, route);
    });
};
