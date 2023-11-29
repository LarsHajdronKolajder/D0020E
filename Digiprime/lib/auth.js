const axios = require("axios");

const AUTH_BASE_URL = process.env.AUTH_BASE_URL;
if (!AUTH_BASE_URL) {
  throw new Error("Environment variable AUTH_BASE_URL must be set");
}

/**
 * Log in the user to the GIS service Login Controller.
 *
 * Username/password based authentication, which returns a JWT on success. This
 * JWT should be verified on every request. This can be done by calling the
 * `verify` function in this module.
 *
 * ## Returns
 *
 * A successful response returns the login details
 *
 * ## Errors
 *
 * - 401 `Unauthorized` when credentials are wrong.
 * - 500 `Internal Server Error`
 *
 * ## Example
 *
 * Function can be called as
 * ```js
 * const { login } = require("");
 * const user = await login("username", "password");
 * ```
 *
 * A successful login may return
 * ```json
 * {
 *     "user": {
 *         "uuid": "uuid",
 *         "username": "string",
 *         "email": "string",
 *         "countryCode": null,
 *         "countryName": null,
 *         "regionName": null,
 *         "roles": ["string"],
 *         "groupNames": ["ltu"]
 *     },
 *     "jwt": "<snip>"
 * }
 * ```
 *
 * A call with the wrong credentials may return
 * ```json
 * {
 *     "timestamp": 1649931797,
 *     "status": 401,
 *     "error": "unauthorized",
 *     "message": "401 Unauthorized: [{\"error\":\"invalid_grant\",\"error_description\":\"Invalid user credentials\"}]",
 *     "path": "/orc/user/login"
 * }
 * ```
 *
 * @param {string} username Username to authenticate with.
 * @param {string} password Password to authenticate with.
 * @returns {Promise<{
 *  jwt: string;
 *  user: {
 *    countryCode: string;
 *    countryName: string;
 *    email: string;
 *    groupNames: [string];
 *    regionName: string;
 *    roles: [string];
 *    username: string;
 *    uuid: string;
 *  }
 * }>}
 */
module.exports.login = async (username, password) => {
  const url = `${AUTH_BASE_URL}/user/login`;
  const { data } = await axios.post(url, { username, password });
  return data;
};
