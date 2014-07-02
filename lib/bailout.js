var _ = require('underscore'),
    Config = require('./config');

module.exports = function (request, reply) {

    var deregistered = request.url.href.match(new RegExp(Config.get("mocksRouteBase") + "(.*)"));

    // Don't accept encoding so we don't have to gunzip stuff later on
    delete request.headers['accept-encoding'];

    delete request.app.ridiculed;

    request.headers['x-dontridicule'] = 'true';

    request.server.inject({
        method: request.method,
        url: deregistered[1],
        headers: request.headers,
        payload: request.payload,
        credentials: request.auth.credentials,
        ridiculed: true
    }, function(res) {

          var headers = res.headers;
          var response = reply(res.result);

          // pass along upstream status code
          response.code(res.statusCode);

          // include all upstream headers
          _.each(headers, function(value, name) {

              response.header(name, value);
          });
    });
};
