module.exports = function (requestQuery, validation) {
    var validator = validation.validator;
    var callback = validation.callback || function () { };
    var validated;

    // Allow for catchall validation
    if (validator === true) {
        validated = true;
    }

    if (!validated) {
        validated = Object.keys(requestQuery).every(function (prop) {

            var validateValue = validator[prop];
            var requestQueryValue = requestQuery[prop];

            // Fail if there is no validation for this field
            if (validateValue === undefined) {
                return;
            }

            if (typeof validateValue === "function") {
                return !!validateValue(requestQuery[prop]);
            }

            // It is either a number, string literal, or a RegExp. We can cover all by loading it in a RegExp and matching against it.
            return new RegExp(validateValue).exec(requestQueryValue);

        });
    }

    if (validated) {
        process.nextTick(callback);
        return true;
    }

};
