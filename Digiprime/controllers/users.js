const User = require("../models/user");
const ne = require("../lib/ne");
const auth = require("../lib/auth");
const ExpressError = require("../utils/ExpressError");
const cookie = require('cookie');


module.exports.login = (_req, res) => {
  res.render("users/login");
};

module.exports.onLogin = (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl =
    req.session.returnTo || `${req.app.locals.baseUrl}/offers`;
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "Success logout!");
  res.redirect(`${req.app.locals.baseUrl}/offers`);
};

module.exports.authenticate = async (req, username, password) => {
  let email, userId;

  try {
    const token = await auth.login(username, password);
    email = token.user.email;
    userId = token.user.uuid;
    jwt = token.jwt;

    
  } catch (err) {
    if (err.isAxiosError && err.response.data.error == "unauthorized") {
      req.flash("error", "Wrong username or password");
      return null;
    }
    throw err;
  }

  let user = await User.findOne({ userId }).exec();
  if (!user) {
    // No user was found. Create a new user.
    user = new User({ username, email, userId, role: "user" });

    // We cannot prevent double writes here. So check for the error that the user already exists
    // and if we get that, then we must have done this before. So still create our user.
    try {
      await ne.signup(username, email, password);
    } catch (err) {
      if (err.isAxiosError && err.response && err.response.status === 400) {
        // User already exists. Allow this error to occur.
      } else {
        throw new ExpressError("Failed to create user (NE)", 500);
      }
    }

    // We save the user here, since it's more likely that the call to NE
    // fails, rather than this call.
    await user.save();
  }
  user.JWT = jwt;
  console.log(user)

  return user;
};
