var Crypto = require('crypto'),
    Joi = require('joi'),
    LogErr = require('./error'),
    stringOrArrayOfStrings = Joi.alternatives().try(Joi.array().min(1).includes(Joi.string()), Joi.string()),
    internals = {};


internals.schema = Joi.object().keys({
  'apiPrefix': stringOrArrayOfStrings.default('/api'),
  'mocksDir': Joi.string().min(1).default(__dirname + '/../mocks'),
  'mocksAdminPath': Joi.string().min(1).default('/admin/mocks'),
  'mocksAdminServerLabels': stringOrArrayOfStrings.default(['admin']),
  'mocksRouteBase': Joi.string().default('/' + Crypto.randomBytes(20).toString('hex')),
  'enabled': Joi.boolean().default(false),
  'enableForceCookiePage': Joi.boolean().default(false),
  'forceCookiePath': Joi.string().default('/cookie'),
  'forceCookieValue': Joi.string().default('true')
});


internals.Config = function (config) {

    var self = this;

    if (config.mocksRouteBase) {
      LogErr('mocksRouteBase is an internal only property. ignoring supplied value: ' + config.mocksRouteBase);
      delete config.mocksRouteBase;
    }

    Joi.validate(config, internals.schema, function(err, validatedConfig) {
      if (err) {
        throw new Error(err);
      }
      self.config = validatedConfig;
    });
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
