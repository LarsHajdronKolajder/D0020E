const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const notification = require("../controllers/notification");
const { isLoggedIn, isValidId } = require("../middleware");

router.route("/").get(isLoggedIn, catchAsync(notification.list));

router
  .route("/seen")
  .post(isLoggedIn, catchAsync(notification.mark_all_as_read));

router
  .route("/:id")
  .get(isLoggedIn, isValidId, catchAsync(notification.redirect));

module.exports = router;
