const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const auction = require("../controllers/auctions");
const {
  isLoggedIn,
  isValidId,
  validatePlaceBid,
  checkParamsSingleOfferAuction,
  validateCreateSingleOfferAuction,
  checkParamsAuction,
  validateAuction,
  validateBrokerRepresent,
} = require("../middleware");

router.route("/").get(isLoggedIn, catchAsync(auction.index));

router.route("/history").get(isLoggedIn, catchAsync(auction.history));

router
  .route("/create")
  .get(isLoggedIn, checkParamsAuction, catchAsync(auction.renderCreateAuction))
  .post(isLoggedIn, validateAuction, catchAsync(auction.createAuction));

router
  .route("/create-public")
  .get(
    isLoggedIn,
    checkParamsSingleOfferAuction,
    catchAsync(auction.renderCreatePublicAuction)
  )
  .post(
    isLoggedIn,
    validateCreateSingleOfferAuction,
    catchAsync(auction.createPublicAuction)
  );

router.route("/public").get(isLoggedIn, catchAsync(auction.listPublic));

router
  .route("/:id")
  .get(isLoggedIn, isValidId, catchAsync(auction.show))
  .post(isLoggedIn, isValidId, validatePlaceBid, catchAsync(auction.placeBid));

router.route("/:id/join").post(isLoggedIn, isValidId, catchAsync(auction.join));
router
  .route("/:id/represent")
  .post(
    isLoggedIn,
    isValidId,
    validateBrokerRepresent,
    catchAsync(auction.represent)
  );

router
  .route("/:id/invite")
  .get(isLoggedIn, isValidId, catchAsync(auction.showInvite))
  .post(isLoggedIn, isValidId, catchAsync(auction.performInvite));

module.exports = router;
