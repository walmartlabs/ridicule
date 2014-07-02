module.exports = function (request, reply, validation) {
    var _isFunction = require('lodash.isfunction');
    var validator = validation.validator || {};
    var validated;

    // Allow for catchall validation
    if (validator === true) {
        validated = true;
    }

    if (!validated) {
        var requestQuery = request.query || {};
            validated = Object.keys(requestQuery).every(function (prop) {

                var validateValue = validator[prop];
                var requestQueryValue = requestQuery[prop];

                // Fail if there is no validation for this field
                if (validateValue === undefined) {
                    return;
                }

                // Accept any and everything
                if (validateValue === true) {
                    return true;
                }

                // Validate against a literal Regex
                if (validateValue.exec) {
                    return !!validateValue.exec(requestQueryValue);
                }

                if (_isFunction(validateValue)) {
                    return !!validateValue(requestQueryValue);
                }

                return validateValue === requestQueryValue;

            });
    }

    if (validated) {
        if (validation.callback) {
            process.nextTick(function() {

                validation.callback(request, reply);
            });
        }

        return true;
    }
};
