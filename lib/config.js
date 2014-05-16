var Hapi = require("hapi");
var Crypto = require("crypto");
var internals = {};


internals.defaults = {
    "apiPrefix": "/api",
    "mocksDir": __dirname + "/../mocks",
    "mocksAdminPath": "/admin/mocks",
    "mocksRouteBase": "/" + Crypto.randomBytes(20).toString("hex"),
    "safeHarbor": Crypto.randomBytes(20).toString("hex"),
    "enabled": false,
};


internals.Config = function (config) {

    this.config = Hapi.utils.applyToDefaults(internals.defaults, config);
};


internals.Config.prototype.get = function (key) {

    // Return the entire config when called without a key
    return key ? this.config[key] : this.config;
};


internals.Config.prototype.set = function (key, value) {

    this.config[key] = value;
    return this.config[key];
};


exports.init = function (config) {

    internals.config = new internals.Config(config);
    exports.get = internals.config.get.bind(internals.config);
    exports.set = internals.config.set.bind(internals.config);
};
