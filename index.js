// Declare internals

var path = require('path'),
    fs = require('fs'),
    internals = {},
    prePangeaPathDir = '',
    prePangeaRoutes = [],
    apiCheck,
    settings;

// Defaults

internals.defaults = {
  'apiPrefix': '/api',
  'mocksDir': __dirname + '/mocks',
  'enabled': false
};

exports.register = function (plugin, options, next) {

  settings = plugin.hapi.utils.applyToDefaults(internals.defaults, options);
  settings.mocksDir = path.resolve(settings.mocksDir);

  internals.plugin = plugin;

  for (var setting in settings) {
    settings[setting] = enforceSuffix(settings[setting], '/');
  }

  if (settings.prePangea) {
    var pathSource = require(path.resolve(settings.prePangea + '/paths.js'));

    for (var name in pathSource) {
      if (name === '__dirname') {
        prePangeaPathDir = pathSource[name];
      } else {
        prePangeaRoutes.push({
          regex: new RegExp(name),
          source: pathSource[name]
        });
      }
    }
  }

  apiCheck = new RegExp('^\\' + settings.apiPrefix + '.*');

  plugin.select('api').ext('onRequest', internals.onRequest);

  plugin.views({
    'engines': {
      'handlebars': {
        'module': require('handlebars')
      }
    },
    'path': './templates'
  });

  plugin.route({
    'method': '*',
    'path': '/admin/mocks',
    'handler': function(req, res) {
      if (req.payload) {
        settings.enabled = (req.payload.enabled === "true");
      }
      res.view('index', settings);
    }
  });

  next();
};

function enforceSuffix(str, prefix) {
  if (typeof str !== 'string') return str;
  var ending = str.substr(-prefix.length).toLowerCase();
  return ending === prefix.toLowerCase() ? str : str + prefix;
}

function isInsecurePath(path) {
  return !!path.match(/\.\./g);
}

function addMethod(mockPath, method) {
  return mockPath.replace(/\.json$/, '_' + method.toUpperCase() + '.json');
}

function isFile(path) {
  return fs.existsSync(path) && fs.statSync(path).isFile();
}

function resolveMock(mockPath) {
  var suffix = mockPath.match(/_(DELETE|GET|PUT|POST|PATCH)\.json/)[0],
      resolved = settings.mocksDir,
      toResolve;

  // first we check if the exact request is a file
  if (isFile(mockPath)) {
    return path.resolve(mockPath);
  }

  // if that didn't work, we verify the directory path, from left to right

  // mocksDir should exist, so we remove that to reduce the work
  toResolve = mockPath.slice(settings.mocksDir.length, mockPath.length).split('/');

  // iterate from the left, adding a dir to `resolved` for every resolved path
  toResolve.every(function(item) {
    var resolve = resolved + item;
    // check the literal path
    if (fs.existsSync(resolve)) {
      resolved = enforceSuffix(resolve, '/');
    } else if (fs.existsSync(resolved + 'general' + suffix)) {
      // check for `general` JSON files
      resolved = enforceSuffix(resolved + 'general', suffix);
    } else if (fs.existsSync(resolved + 'general')) {
      // check for `general` dirs
      resolved = enforceSuffix(resolved + 'general', '/');
    }  else {
      // a specific file doesn't exist, so we unset `resolved` for the final
      // return value
      resolved = undefined;
    }
    return resolved;
  });


  // if resolved isn't a file, unset it
  if (!isFile(resolved)) resolved = undefined;

  return resolved;
}

function getMockLocation(request) {
  var mockPath = request.url.pathname.replace(settings.apiPrefix, settings.mocksDir);
  mockPath = enforceSuffix(mockPath, '.json');
  mockPath = addMethod(mockPath, request.method);

  if (isInsecurePath(mockPath)) return;

  return resolveMock(mockPath);
}

function matchPrePangeaPath(path) {
  var route;

  for (var i = 0, l = prePangeaRoutes.length; i < l; i++) {
    route = prePangeaRoutes[i];

    if (route.regex.test(path)) {
      return route;
    }
  }
}

internals.onRequest = function (req, next) {
  if (settings.enabled) {
    if (settings.prePangea) {
      var matchedRoute = matchPrePangeaPath('/m' + req.url.path);
      if (matchedRoute) {
        req.raw.res.end(matchedRoute.source());
        return;
      }
    }
    if (apiCheck.test(req.url.pathname)) {
      var mockFile = getMockLocation(req);
      console.log(mockFile);
      if (mockFile) {
        internals.plugin.log(['request'], 'Mocking: ' + req.url.pathname);
        fs.createReadStream(mockFile).pipe(req.raw.res);
        return;
      }
    }
  }
  next();
};

