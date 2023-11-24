const express = require("express");
const router = express.Router();
const passport = require("passport");
const users = require("../controllers/users");

router
  .route("/login")
  .get(users.login)
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/auth/login",
    }),
    users.onLogin
  );

router.post("/logout", users.logout);

module.exports = router;
