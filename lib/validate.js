module.exports = function (request, reply, validation) {
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

            if (validateValue === true) {
                return true;
            }

            if (validateValue.exec) {
                return !!validateValue.exec(requestQueryValue);
            } else if (typeof validateValue === "function") {
                return !!validateValue(requestQueryValue);
            } else {
                return validateValue === requestQueryValue;
            }
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
