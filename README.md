# ridicule

hapi plugin providing mocks for restful and querystring based APIs

## setup

The following options are available for configuration.

  `apiPrefix`  
  A string or array of strings representing the base of the routes that should
  be mocked  
  *Defaults to `/api`*

  `mocksDir`  
  Directory containing the mock files.  
  *Defaults to `__dirname + './mocks'`, where __dirname is this plugin*

  `mocksAdminPath`  
  A relative URL that the admin page for this plugin can be found.  
  *Defaults to `/admin/mocks`*

  `mocksAdminServerLabels`  
   An array of labels used during hapi's plugin registration  
  *Defaults to `['admin']`*

  `enabled`  
  Wether or not the mocks are enabled.  
  *Defaults to `false`*

## how it works
Inside of your `mocksDir`, create a `ridicule.js` file that exposes an array
hapi routes in it's `module.exports`.

At the start of the server, all configured routes are registered with a
random 40 character prefix. (e.g. the route `/foo` is mocked out at `/(uuid)/foo`)

When the mock server is [enabled](#enabling-your-mocks), all incoming requests are
matched against the configured `apiPrefix`. When a match is found, the request is
internally forwarded to the mock route handler.

You have the ability to bailout on mocking out the request in a handler (useful for
when you are mocking out only a subset of a querystring based system, since hapi
matches on paths only). Simply `require` rididcule in the file, and then call
`ridicule.bailout(req, res)`, where `req` and `res` are the request and response
objects inside of the handler.

## configuring your mocks

The most common way of mocking out requests is just to return the data of a json
file within the `reply()` interface of your route handler.

``` javascript
    var data = require('./mockFile.json');

    var route = {
        method: '*',
        path: '/mockPath',
        config: {
            handler: function (request, reply) {
                return reply(data);
            }
        }
    };
```

However, you have the ability to add additional metadata to the response, such as
custom headers and HTTP status codes.
You just need to wrap up your existing json file inside of another object,
setting the original to `payload`, and add a `ridiculeSettings` field.

so this request

```json
{
    "foo": "bar"
}
```

becomes
```json
{
    "ridiculeSettings": {
        "statusCode": 418,
        "headers": {
            "Content-Type": "x-stream"
        }
    }
    payload: {
        "foo": "bar"
    }
}
```

The `payload` value does not follow the normal request flows and consequently only support string and JSON objects.

## enabling your mocks

There are three ways to enable/disable mocks.

  1. **The hapi configuration setting**

     You can change the `enabled` opton in your [setup](#setup) to `true`. This enables
     it at start, but can changed in the future by..

  2. **Toggling the admin page button**

     You can turn mocks on or off at any time by visting the path [configured](#setup) under
     `mocksAdminPath`. By default this is `/admin/mocks`. Note that this is
     registered behind a hapi label (configurable in your setup, but `['admin']`
     by default). This allows you to ship ridicule in your production site, and
     have the toggle switch exist on a port that isn't publicly accessible.

  3. **A cookie on the client**

     If the cookie `always_ridicule=true` is set on the client, then the configured
     mocks will always be served (until it is deleted, of course). Conversely,
     `always_ridicule=false` will force the client to never be mocked out, regardless
     of the server's current settings.


## querystrings

Since hapi matches routes only on paths (and not any querystring parameters),
you need to be able to match more than one query against a path. For that,
ridicule provides `ridicule.validate` method.

### validation

`ridicule.validate` is a function that takes a request+reply pair, then a validation
object, consisting a `validator` object, and a `callback` function.

The `validator` object is a plain object, where each key represents the key of
the querystring, and the value is either a string, RegExp, or function that
matches the value of the corresponding value in the querystring.

For example, the following querystring

`?category=Music&genre=ska&year=2012`

would match the following validation

```javascript
...
  handler: function(request, reply) {
      ridicule.validate(request, reply, {
          validator: {
              category: 'Music',
              genre: function(value) {
                return value === 'ska' || value === 'rocksteady'
              },
              year: /^\d{4}$/
          },
          callback: function(request, reply) {
              reply({'all': 'good'});
          }
      })
  }
...
```

of course you can easily chain multiple checks

```javascript
      var queriesToCheck = [{
        validator: {
            category: 'Music',
            genre:'ska',
            year: /^\d{4}$/
        },
        callback: function(request, reply) {
            reply().file('./authMock.json');
        }
      },{
        validator: {
            foo: 'bar',
            baz: 'biz'
        },
        callback: function(request, reply) {
            reply({'wordsAre': 'hard'});
        }
      }];

      queriesToCheck.some(function(route) {
        return ridicule.validate(request, reply, route);
      });
```

### bailout

You may run into an issue where you want to mock out a subset of your requests at
an endpoint, but not all of them. In this case, ridicule provides a handy helper
function, `ridicule.bailout`.

all you need to do is add it to the end of your query checks, passing through
the handlers `request` and `reply` interfaces.

```javascript
      var matched = queriesToCheck.some(function(route) {
          return ridicule.validate(request, reply, route);
      });

      if (!matched) {
          ridicule.bailout(request, reply);
      }
```

An alternative to this is setting the validator object on your final query to
`true`. This will automatically match the supplied query, and can act as a catchall

```javascript
      var queriesToCheck = [{
        validator: {
            category: 'Music',
            genre:'ska',
            year: /^\d{4}$/
        },
        callback: function(request, reply) {
            reply().file('./authMock.json');
        }
      },{
        validator: true,
        callback: function(request, reply) {
            reply().file('./catchall.json');
        }
      }];

      queriesToCheck.some(function(route) {
        return ridicule.validate(request, reply, route);
      });
```
