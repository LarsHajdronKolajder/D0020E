const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const negotiation = require("../controllers/negotiation");
const {
  isLoggedIn,
  isValidId,
  validateNegotiation,
  validatePlaceBid,
  validateBrokerRepresent,
} = require("../middleware");

router.route("/").get(isLoggedIn, catchAsync(negotiation.list));

router
  .route("/create/:id")
  .get(isLoggedIn, isValidId, catchAsync(negotiation.showCreate))
  .post(
    isLoggedIn,
    isValidId,
    validateNegotiation,
    catchAsync(negotiation.create)
  );

router
  .route("/:id")
  .get(isLoggedIn, isValidId, catchAsync(negotiation.show))
  .post(
    isLoggedIn,
    isValidId,
    validatePlaceBid,
    catchAsync(negotiation.placeBid)
  );

router
  .route("/:id/accept")
  .post(isLoggedIn, isValidId, catchAsync(negotiation.accept));

router
  .route("/:id/cancel")
  .post(isLoggedIn, isValidId, catchAsync(negotiation.cancel));

router
  .route("/:id/represent")
  .post(
    isLoggedIn,
    isValidId,
    validateBrokerRepresent,
    catchAsync(negotiation.represent)
  );

module.exports = router;
