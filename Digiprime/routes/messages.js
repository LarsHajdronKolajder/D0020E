const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const messages = require("../controllers/messages");
const {
  isLoggedIn,
  validateNewMessage,
  validateMessageReply,
} = require("../middleware");

router.route("/").get(isLoggedIn, catchAsync(messages.list));

router
  .route("/new")
  .post(isLoggedIn, validateNewMessage, catchAsync(messages.create));

router
  .route("/:id")
  .get(isLoggedIn, catchAsync(messages.show))
  .post(isLoggedIn, validateMessageReply, catchAsync(messages.reply));

router.route("/:id/mark").post(isLoggedIn, catchAsync(messages.mark));

module.exports = router;
