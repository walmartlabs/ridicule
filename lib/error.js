var SupportsColor = require('supports-color'),
    startRed = SupportsColor ? '\u001b[31m' : '',
    endRed = SupportsColor ? '\u001b[39m' : '';

module.exports = function(str) {
  return console.error(startRed + 'ridicule: ' + str + endRed);
};
