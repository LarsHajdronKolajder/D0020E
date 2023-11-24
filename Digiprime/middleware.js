const ExpressError = require("./utils/ExpressError");
const Offer = require("./models/offer");
const Review = require("./models/review");
const {
  offerSchema,
  reviewSchema,
  profileSchema,
  usernameSchema,
  placeBidSchema,
  selectWinnerSchema,
  IdSchema,
  validateCreateNegotiation,
  directorySchema,
  newMessageSchema,
  messageReplySchema,
  createSingleOfferAuctionSchema,
  createAuctionSchema,
  singleOfferAuctionSchema,
  auctionSchema,
  brokerAgreementSchema,
  representSchema,
} = require("./schemas.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be signed in first");
    return res.redirect(`${req.app.locals.baseUrl}/auth/login`);
  }
  next();
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const offer = await Offer.findById(id);
  if (!offer.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`${req.app.locals.baseUrl}/offers/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`${req.app.locals.baseUrl}/offers/${id}`);
  }
  next();
};

module.exports.sanitizeDirectoryQuery = (req, res, next) => {
  const { error } = directorySchema.validate(req.query);
  if (error) {
    req.flash("error", "Invalid search query");
    res.redirect(`${req.app.locals.baseUrl}/offers/directory`);
  } else {
    next();
  }
};

/**
 * Validates the body against a Joi schema.
 *
 * @param {object} schema Joi schema to validate against.
 * @param {number} statusCode status code to return on failure, defaults to 400.
 * @returns
 */
// prettier-ignore
const validateBody = (schema, statusCode = 400) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, statusCode);
  }
  next();
};

/**
 * Validates the query against a Joi schema.
 *
 * @param {object} schema Joi schema to validate against.
 * @param {number} statusCode status code to return on failure, defaults to 400.
 * @returns
 */
// prettier-ignore
const validateQuery = (schema, statusCode = 400) => (req, res, next) => {
  const { error } = schema.validate(req.query);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, statusCode);
  }
  next();
};

/**
 * Validates the parameters against a Joi schema.
 *
 * @param {object} schema Joi schema to validate against.
 * @param {number} statusCode status code to return on failure, defaults to 400.
 * @returns
 */
// prettier-ignore
const validateParams = (schema, statusCode = 400) => (req, res, next) => {
  const { error } = schema.validate(req.params);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, statusCode);
  }
  next();
};

/**
 * Validate body when creating a new offer.
 */
module.exports.validateOffer = validateBody(offerSchema);

/**
 * Validate body when creating a new review.
 */
module.exports.validateReview = validateBody(reviewSchema);

/**
 * Checks if the parameters contains an `id` field with a valid mongo id.
 */
module.exports.isValidId = validateParams(IdSchema, 404);

/**
 * Validate fields when placing a bid.
 */
module.exports.validatePlaceBid = validateBody(placeBidSchema);

/**
 * Validate query params for creating a single offer auction. This is not for
 * security, rather than not wasting the user's time if they get a weird url.
 */
module.exports.checkParamsSingleOfferAuction = validateQuery(
  createSingleOfferAuctionSchema
);

/**
 * Validate fields when creating a single-offer auction.
 */
module.exports.validateCreateSingleOfferAuction = validateBody(
  singleOfferAuctionSchema
);

/**
 * Validate query params for creating a multiple offer auction.
 */
module.exports.checkParamsAuction = validateQuery(createAuctionSchema);

/**
 * Validate fields when creating a multiple-offer auction.
 */
module.exports.validateAuction = validateBody(auctionSchema);

/**
 * Validate the the parameter contains a valid username.
 */
module.exports.validateUsername = validateParams(usernameSchema, 404);

/**
 * Validate fields when editing user profile.
 */
module.exports.validateEditProfile = validateBody(profileSchema);

/**
 * Validate fields when creating a negotiation.
 */
module.exports.validateNegotiation = validateBody(validateCreateNegotiation);

/**
 * Validate fields when creating a new message.
 */
module.exports.validateNewMessage = validateBody(newMessageSchema);

/**
 * Validate fields when replying to a message in a conversation.
 */
module.exports.validateMessageReply = validateBody(messageReplySchema);

/**
 * Validate fields when creating a broker agreement.
 */
module.exports.validateBrokerAgreement = validateBody(brokerAgreementSchema);

/**
 * Validate fields when a broker wants to represent a user.
 */
module.exports.validateBrokerRepresent = validateBody(representSchema);
