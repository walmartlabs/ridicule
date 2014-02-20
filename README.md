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

  `mocksAdminEnabled`  
  Wether or not the admin page is reachable.  
  *Defaults to `false`*

  `enabled`  
  Wether or not the mocks are enabled.  
  *Defaults to `false`*

## how it works
Inside of your `mocksDir`, create a `ridicule.js` file that exposes an array
hapi routes in it's `module.exports`.

At the start of the server, all configured routes are registered with a
random 40 character prefix. (e.g. the route `/foo` is mocked out at `/(uuid)/foo`)

When the mock server is enabled (set at runtime in the plugin configuration, or
togglable at anytime at `mocksAdminPath`, if it is `mocksAdminEnabled`), all
incoming requests are matched against the configured `apiPrefix`. When a match
is found, the request is internally forwarded to the mock route handler.

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
        "headers": [
            "Content-Type": "x-stream"
        ]
    }
    payload: {
        "foo": "bar"
    }
}
```

## querystrings

Since hapi matches routes only on paths (and not any querystring parameters),
you need to be able to match more than one query against a path. For that,
ridicule provides `ridicule.validate` method.

### validation

`ridicule.validate` is a function that takes a query string, then a validation
object, consisting a `validator` object, and a `callback` function.

The `validator` object is a plain object, where each key represents the key of
the querystring, and the value is either a string, RegExp, or function that
matches the value of the corresponding value in the querystring.

For example, the following querystring

`?service=Authentication&method=verify&version=1`

would match the following validation

```javascript
...
  handler: function(request, reply) {
      ridicule.validate(requery.query, {
          validator: {
              service: 'Authentication',
              method: function(value) {
                return value === 'verify' || value === 'logout'
              },
              version: /\d/
          },
          callback: function() {
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
            service: 'Authentication',
            method:'verify',
            version: /\d/
        },
        callback: function() {
            reply().file('./authMock.json');
        }
      },{
        validator: {
            foo: 'bar',
            baz: 'biz'
        },
        callback: function() {
            reply({'wordsAre': 'hard'});
        }
      }];

      queriesToCheck.some(function(route) {
        return ridicule.validate(request.query, route);
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
          return ridicule.validate(request.query, route);
      });

      if (!matched) {
          ridicule.bailout(request, reply);
      }
```

This sets a magic cookie on the request, then redirects from the mocked route via
a 302 back to the original unmocked route. ridicule checks for the existence of
this cookie before remocking the request, and if found, doesn't touch it. As a
result, the request will serve as normal (other than the redirects caused by ridicule).

An alternative to this is setting the validator object on your final query to
`true`. This will automatically match the supplied query, and can act as a catchall

```javascript
      var queriesToCheck = [{
        validator: {
            service: 'Authentication',
            method:'verify',
            version: /\d/
        },
        callback: function() {
            reply().file('./authMock.json');
        }
      },{
        validator: true,
        callback: function() {
            reply().file('./catchall.json');
        }
      }];

      queriesToCheck.some(function(route) {
        return ridicule.validate(request.query, route);
      });
```
