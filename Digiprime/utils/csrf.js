const csrf = require("csurf");

module.exports.csrfProtection = csrf({ cookie: false });
