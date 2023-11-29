const Offer = require("../models/offer");
const ne = require("../lib/ne");
const { paginate } = require("../lib/paginate");
const ExpressError = require("../utils/ExpressError");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const { getCoordinatesFromLocation } = require("../lib/location");
const { paginate2, getPaginationParams } = require("../lib/paginate");

/**
 * Shows the page for creating a negotiation.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.showCreate = async (req, res) => {
  const { id: offerId } = req.params;
  const { username, role } = req.user;

  const [offer, contracts] = await Promise.all([
    Offer.findById(offerId).populate("author"),
    ne.contractList("auction"), // TODO
  ]);

  if (!offer) {
    throw new ExpressError("Offer not found", 404);
  }

  // Ensure the other party in the negotiation is another user.
  if (username === offer.author.username) {
    throw new ExpressError("Cannot create a negotiation with yourself", 400);
  }

  let agreements = [];
  if (role == "broker") {
    agreements = await ne.getRepresenting(username);
  }

  res.render("negotiations/create", { offer, contracts, agreements });
};

const getBrokerOptions = async (username, role, members) => {
  const brokerOptions = {
    canRepresent: [],
    isRepresenting: undefined,
  };

  if (role !== "broker") {
    return brokerOptions;
  }

  agreements = await ne.getRepresenting(username);

  // Get usernames of represented users.
  const agreementsWith = {};
  agreements.forEach(
    (agreement) => (agreementsWith[agreement.represented] = agreement)
  );

  // Check if the members correspond to those users.
  for (const member of members) {
    const agreement = agreementsWith[member.username];
    if (!agreement) continue;

    if (member.represented_by == username) {
      // If we represent this user.
      brokerOptions.isRepresenting = {
        username: member.username,
        agreementId: agreement._id,
      };
    } else if (member.represented_by == "") {
      // Member is not represented by anyone else.
      brokerOptions.canRepresent.push({
        username: member.username,
        agreementId: agreement._id,
      });
    }
  }

  return brokerOptions;
};

/**
 * Shows the page for displaying a single negotiation.
 *
 * This includes both pages for then it's active and when it's already completed.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.show = async (req, res) => {
  const { id: negotiationId } = req.params;
  const { username, role } = req.user;

  const negotiation = await ne.getNegotiation(
    username,
    negotiationId,
    role === "broker"
  );
  const offer = await Offer.findById(negotiation.articleno).populate("author");

  const { canRepresent, isRepresenting } = await getBrokerOptions(
    username,
    role,
    negotiation.members
  );

  let currentUsername = username;
  if (role === "broker") {
    for (const member of negotiation.members) {
      if (member.represented_by === username) {
        currentUsername = member.username;
        break;
      }
    }
  }

  for (const member of negotiation.members) {
    if (member.is_room_admin) {
      negotiation.creator = member;
    } else {
      negotiation.participant = member;
    }
  }

  res.render("negotiations/show", {
    negotiation,
    offer,
    currentUsername,
    canRepresent,
    isRepresenting,
  });
};

/**
 * List all of the user's negotiations.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.list = async (req, res) => {
  const { username, role } = req.user;
  const [skip, limit] = getPaginationParams(req.query.page, 10);

  let agreements = [];
  if (role == "broker") {
    agreements = await ne.getRepresenting(username);
  }

  let negotiations, total;
  if (role === "broker" && req.query.user) {
    const user = req.query.user;
    const representing = agreements.map((agreement) => agreement.represented);

    if (representing.includes(user)) {
      [negotiations, total] = await ne.listNegotiations(user, skip, limit);
    } else {
      throw new ExpressError(
        "Cannot view a user you are not representing",
        403
      );
    }
  } else {
    [negotiations, total] = await ne.listNegotiations(
      username,
      skip,
      limit,
      role == "broker"
    );
  }

  // const { negotiations, total } = await ne.listNegotiations(
  //   username,
  //   skip,
  //   limit
  // );

  res.render("negotiations/list", {
    page: paginate2(negotiations, total, skip, limit, req.query),
    formatDistanceToNow,
    agreements,
  });
};

/**
 * Create the negotiation and redirect to the newly created negotiation's page.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.create = async (req, res) => {
  const { username } = req.user;
  const { id: offerId } = req.params;
  const { title, price, quantity, unit, contract, brokerId, location } =
    req.body;

  const offer = await Offer.findById(offerId).populate("author");
  if (!offer) {
    throw new ExpressError("Offer not found", 400);
  }

  // Ensure the other party in the negotiation is another user.
  if (username === offer.author.username) {
    throw new ExpressError("Cannot create a negotiation with yourself", 400);
  }

  const member = {
    username: offer.author.username,
    location: offer.geometry.coordinates,
    offer_id: offer._id,
  };

  const locationCoordinates = await getCoordinatesFromLocation(location);
  const id = await ne.createNegotiation(
    username,
    title,
    locationCoordinates,
    parseInt(price),
    parseInt(quantity),
    unit,
    member,
    contract,
    offer.referenceSector,
    offer.referenceType,
    brokerId
  );

  req.flash("success", `Successfully created negotiation ${title}`);
  res.redirect(`${req.app.locals.baseUrl}/negotiations/${id}`);
};

/**
 * Place a bid on a specific negotiation. Redirects to the negotiation's page.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.placeBid = async (req, res) => {
  const { username } = req.user;
  const { id } = req.params;
  const { bid } = req.body;

  await ne.negotiationBid(username, id, bid);

  req.flash("success", `Successfully placed counter offer ${bid}`);
  res.redirect(`${req.app.locals.baseUrl}/negotiations/${id}`);
};

/**
 * Accept a bid on a negotiation. Redirects to the negotiation's page.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.accept = async (req, res) => {
  const { username } = req.user;
  const { id } = req.params;

  await ne.negotiationAccept(username, id);

  req.flash("success", "Successfully accepted negotiation");
  res.redirect(`${req.app.locals.baseUrl}/negotiations/${id}`);
};

/**
 * Cancel the negotiation. Redirects to the negotiation's page.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.cancel = async (req, res) => {
  const { username } = req.user;
  const { id } = req.params;

  await ne.negotiationCancel(username, id);

  req.flash("success", "Successfully cancelled negotiation");
  res.redirect(`${req.app.locals.baseUrl}/negotiations/${id}`);
};

module.exports.represent = async (req, res) => {
  const { username } = req.user;
  const { id: negotiationId } = req.params;
  const { brokerId } = req.body;

  try {
    ne.representInAuction(username, negotiationId, brokerId);
    req.flash("success", `Successfully represented user in negotiation`);
  } catch (err) {
    req.flash("error", `Could not represent user in negotiation`);
  }
  res.redirect(`${req.app.locals.baseUrl}/negotiations/${negotiationId}`);
};
