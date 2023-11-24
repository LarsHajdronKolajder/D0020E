const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const broker = require("../controllers/broker");
const { isLoggedIn } = require("../middleware");

router.route("/").get(catchAsync(broker.list));

router
  .route("/:agreementId/accept")
  .post(isLoggedIn, catchAsync(broker.acceptAgreement));

router
  .route("/:agreementId/reject")
  .post(isLoggedIn, catchAsync(broker.rejectAgreement));

module.exports = router;
