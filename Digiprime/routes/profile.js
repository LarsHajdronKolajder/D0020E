const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const profile = require("../controllers/profile");
const broker = require("../controllers/broker");
const {
  isLoggedIn,
  validateEditProfile,
  validateUsername,
  validateBrokerAgreement,
} = require("../middleware");

router
  .route("/edit")
  .get(isLoggedIn, catchAsync(profile.edit))
  .post(isLoggedIn, validateEditProfile, catchAsync(profile.update));

router.route("/:username").get(validateUsername, catchAsync(profile.show));

router
  .route("/:username/offers")
  .get(validateUsername, catchAsync(profile.offers));

router
  .route("/:username/agreement")
  .get(isLoggedIn, validateUsername, catchAsync(broker.createPage))
  .post(
    isLoggedIn,
    validateUsername,
    validateBrokerAgreement,
    catchAsync(broker.create)
  );

module.exports = router;
