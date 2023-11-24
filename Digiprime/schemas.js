const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");
const {
  referenceSectors,
  referenceTypes,
  interests,
} = require("./utils/constants");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

module.exports.offerSchema = Joi.object({
  offer: Joi.object({
    title: Joi.string().required().escapeHTML(),
    price: Joi.number().required().min(0),
    unit: Joi.string().required().escapeHTML(),
    // image: Joi.string().required(),
    costumer: Joi.string().required().escapeHTML(),
    referenceSector: Joi.string().required().escapeHTML(),
    referenceType: Joi.string().required().escapeHTML(),
    description: Joi.string().required().escapeHTML(),
    location: Joi.string().required().escapeHTML(),
  }).required(),
  deleteImages: Joi.array(),
  actAs: Joi.string().escapeHTML(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    body: Joi.string().required().escapeHTML(),
    rating: Joi.number().required().min(1).max(5),
  }).required(),
});

module.exports.directorySchema = Joi.object({
  page: Joi.number(),
  costumer: Joi.string()
    .valid(...interests, "")
    .insensitive(),
  referenceSector: Joi.string()
    .valid(...referenceSectors, "")
    .insensitive(),
  referenceType: Joi.string()
    .valid(...referenceTypes, "")
    .insensitive(),
});

// Schema to check the required fields necessary for create single-offer page.
module.exports.createSingleOfferAuctionSchema = Joi.object({
  offerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/, "offerId")
    .required(),
});

// Schema to check required fields when creating multiple offer auction.
module.exports.createAuctionSchema = Joi.object({
  offerIds: Joi.array()
    .min(2)
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/, "offerId"))
    .required(),
});

// Schema to validate a single-offer style auction.
module.exports.singleOfferAuctionSchema = Joi.object({
  auctionTitle: Joi.string().required().escapeHTML(),
  closingTime: Joi.date().min(Date.now()).required(),
  quantity: Joi.number().required(),
  unit: Joi.string().required().escapeHTML(),
  offerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/, "offerId")
    .required(),
  contract: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

// Schema to validate a multiple-offer style auction.
module.exports.auctionSchema = Joi.object({
  auctionTitle: Joi.string().required().escapeHTML(),
  closingTime: Joi.date().min(Date.now()).required(),
  quantity: Joi.number().required(),
  unit: Joi.string().required().escapeHTML(),
  location: Joi.string().required().escapeHTML(),
  offerIds: Joi.array()
    .min(2)
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/, "offerId"))
    .required(),
  contract: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  brokerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
});

// Schema to validate inputs when placing a bid at an auction.
module.exports.placeBidSchema = Joi.object({
  bid: Joi.number().min(1).required(),
});

// Check for a valid mongo id.
module.exports.IdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

// Schema to validate inputs for `creating profile`.
module.exports.profileSchema = Joi.object({
  firstname: Joi.string().allow("").escapeHTML(),
  surname: Joi.string().allow("").escapeHTML(),
  phone: Joi.string().allow("").escapeHTML(),
  address: Joi.string().allow("").escapeHTML(),
  postcode: Joi.string().allow("").escapeHTML(),
  area: Joi.string().allow("").escapeHTML(),
  country: Joi.string().allow("").escapeHTML(),
  state: Joi.string().allow("").escapeHTML(),
  description: Joi.string().allow("").escapeHTML(),
  company: Joi.string().allow("").escapeHTML(),
  role: Joi.string().valid("user", "broker").escapeHTML(),
});

// Check that the username is kind of valid.
module.exports.usernameSchema = Joi.object({
  username: Joi.string().escapeHTML(),
});

// Schema to validate against creating a negotiation.
module.exports.validateCreateNegotiation = Joi.object({
  title: Joi.string().required().escapeHTML(),
  contract: Joi.string().required().escapeHTML(),
  quantity: Joi.number().required(),
  unit: Joi.string().required().escapeHTML(),
  price: Joi.number().required(),
  location: Joi.string().required().escapeHTML(),
  brokerId: Joi.string().valid("").required().escapeHTML(),
});

module.exports.newMessageSchema = Joi.object({
  username: Joi.string().required().escapeHTML(),
  title: Joi.string().required().escapeHTML(),
  body: Joi.string().required().escapeHTML(),
});

module.exports.messageReplySchema = Joi.object({
  title: Joi.string().required().escapeHTML(),
  body: Joi.string().required().escapeHTML(),
});

module.exports.brokerAgreementSchema = Joi.object({
  endDate: Joi.date().min(Date.now()).required(),
  contract: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

module.exports.representSchema = Joi.object({
  brokerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

module.exports.joinSchema = Joi.object({
  location: Joi.string().required().escapeHTML(),
  brokerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});
