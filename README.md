# ridicule

hapi plugin providing mocks

## setup

The following options are available for configuration.

  `apiPrefix`  
  The prefix for the api that is being mocked.  
  *Defaults to `/api`*

  `mocksDir`  
  Directory containing the mock json files.
  *Defaults to `__dirname + './mocks'`, where __dirname is this repo*

  `enabled`  
  Wether or not the mocks are enabled.  
  *Defaults to `false`*

## admin

You can toggle the mocks on and off by visiting `/admin/mocks`
