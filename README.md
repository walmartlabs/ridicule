# ridicule

hapi plugin providing mocks for restful and querystring based APIs

***
# NOTICE:

## This repository has been archived and is not supported.

[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)
***
NOTICE: SUPPORT FOR THIS PROJECT HAS ENDED 

This projected was owned and maintained by Walmart. This project has reached its end of life and Walmart no longer supports this project.

We will no longer be monitoring the issues for this project or reviewing pull requests. You are free to continue using this project under the license terms or forks of this project at your own risk. This project is no longer subject to Walmart's bug bounty program or other security monitoring.


## Actions you can take

We recommend you take the following action:

  * Review any configuration files used for build automation and make appropriate updates to remove or replace this project
  * Notify other members of your team and/or organization of this change
  * Notify your security team to help you evaluate alternative options

## Forking and transition of ownership

For [security reasons](https://www.theregister.co.uk/2018/11/26/npm_repo_bitcoin_stealer/), Walmart does not transfer the ownership of our primary repos on Github or other platforms to other individuals/organizations. Further, we do not transfer ownership of packages for public package management systems.

If you would like to fork this package and continue development, you should choose a new name for the project and create your own packages, build automation, etc.

Please review the licensing terms of this project, which continue to be in effect even after decommission.##curved-carousel

> A simple way to create an infinitely scrollable carousel, with optional curvature.


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

  `enableForceCookiePage`  
  A boolean representing wether or not to register the cookie setter page.
  This page gives a simple button to turn on or off the `always_ridicule` cookie,
  which allows for a client to opt-in to forcing mock responses, regardless of
  server settings.
  Useful for novice testers or devices where bookmarklet creaton is cumbersome.
  *Defaults to `false`*

  `forceCookiePath`  
  A relative URL that the cookie setter page can be found at.  
  *Defaults to `/cookie`*

  `forceCookieValue`  
  A string representing the value of the `always_ridicule` cookie. Allows for servers
  to have a publically available opt-in mocking method without having the specific
  necessary cookie publically known. `expires` value is 30 minutes from the time
  it is set.  
  *Defaults to `"true"`*

## how it works
Inside of your `mocksDir`, create a `ridicule.js` file that exposes an array
hapi routes in it's `module.exports`.

```javascript
module.exports = [{
    method: 'GET',
    path: '/hello',
    handler: function(request, reply) {

        reply('hello world');
    }
},{
    method: 'POST',
    path: '/goodbye',
    handler: function(request, reply) {

        reply('thanks for all the fish');
    }
}]
```

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
        "headers": { "Content-Type": "x-stream" }
    }
    payload: {
        "foo": "bar"
    }
}
```

Worth noting that since this is added at the very end of the hapi's request flow,
As a result, since `payload` has to be inlined in the mock file, and is therefore
limited to only support string and JSON objects, and not streams or buffers.

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

     If the cookie `always_ridicule` is set with the value from the configured
     `forceCookieValue` (default value is the string "true", e.g. `always_ridicule="true"`)
     on the client, then the configured mocks will always be served (until it is
     deleted, of course). In, addition, `always_ridicule=false` will force the
     client to never be mocked out, regardless of the server's current settings.  

## querystrings

Since hapi matches routes only on paths (and not any querystring parameters),
you need to be able to match more than one query against a path. For that,
ridicule provides `ridicule.validate` method.

### validation

`ridicule.validate` is a function that takes a request and reply pair, then a validation
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
