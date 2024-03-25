const User = require("../models/user");
const Notification = require("../models/notification");

const ExpressError = require("../utils/ExpressError");
const ne = require("../lib/ne");
const { getPaginationParams, paginate2 } = require("../lib/paginate");
const { displayDate } = require("../lib/auction");

/**
 * Display the page for creation of a broker agreement. One of the participants must be a `user`
 * and the other a `broker`.
 *
 * ## Parameters
 * - `username`: expects the other party's username as a parameter.
 *
 * ## Success
 * Shows the page to create an agreement between the two parties.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.createPage = async (req, res) => {
  const { username: currentUsername } = req.user;
  const { username: otherUsername } = req.params;

  const currentUser = await User.findOne({ username: currentUsername }).exec();
  const otherUser = await User.findOne({ username: otherUsername }).exec();

  // Determine which user is the broker and which one is the user.
  //
  // It is an error for both to be brokers, or both to be users.
  let broker, user;
  if (currentUser.role === "broker") {
    if (otherUser.role === "broker") {
      throw new ExpressError("Other user cannot be a broker", 400);
    }
    broker = currentUser;
    user = otherUser;
  } else if (currentUser.role === "user") {
    if (otherUser.role === "user") {
      throw new ExpressError(
        "Cannot initiate an agreement with another user",
        400
      );
    }
    broker = otherUser;
    user = currentUser;
  }

  contracts = await ne.contractList("broker");

  res.render("broker/create", { broker, user, contracts, otherUsername });
};

/**
 * Handler to request to a broker for a certain user.
 *
 * The logged in user requests to be a broker of the user of the username in the
 * passed url.
 *
 * ## Parameters
 * - `username`: Requires the other party's username to be present.
 *
 * ## Success
 * Redirects back to the other party's profile page.
 *
 * ## Errors
 * - 400 Bad Request if an agreement between the two parties already exist.
 * - 400 Bad Request if the user tries to enter into an agreement with another
 *   broker.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.create = async (req, res) => {
  const { username: currentUsername } = req.user;
  const { username: otherUsername } = req.params;
  const { endDate, contract } = req.body;

  const currentUser = await User.findOne({ username: currentUsername }).exec();
  const otherUser = await User.findOne({ username: otherUsername }).exec();

  // Determine which user is the broker and which one is the user.
  //
  // It is an error for both to be brokers, or both to be users.
  let broker, user;
  if (currentUser.role === "broker") {
    if (otherUser.role === "broker") {
      throw new ExpressError("Other user cannot be a broker", 400);
    }
    broker = currentUser;
    user = otherUser;
  } else if (currentUser.role === "user") {
    if (otherUser.role === "user") {
      throw new ExpressError(
        "Cannot initiate an agreement with another user",
        400
      );
    }
    broker = otherUser;
    user = currentUser;
  }

  await ne.brokerCreateAgeement(
    currentUsername,
    broker.username,
    user.username,
    endDate,
    contract
  );

  const notification = new Notification({
    user: otherUser._id,
    category: "Broker",
    message: `New broker agreement recevied from ${currentUsername}`,
    links_to: `broker`,
    seen: false,
  });
  await notification.save();

  req.flash("success", "Successfully requested broker agreement");
  res.redirect(`${req.app.locals.baseUrl}/profile/${otherUsername}`);
};

/**
 * Display the full information about a single agreement.
 *
 * ## Parameters
 * - `agreementId`: The agreement id to show.
 *
 * ## Success
 * Shows the current agreements page.
 *
 * ## Errors
 * - 404 Not Found if the agreement cannot be found.
 * - 403 Unauthorized if the current user is not the agent or subject of the
 *   agreement
 *
 * The 403 may change to a 404, if we decide that we this leaks information
 * about current agreements.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.show = async (req, res) => {
  const { agreementId } = req.params;
  const { _id } = req.user;

  // todo

  res.render("agreements/show", {
    agreement,
  });
};

/**
 * Handler to display all the current agreements in place.
 *
 * ## Success
 * Render page containing all active agreements.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.list = async (req, res) => {
  const { username } = req.user;
  const [skip, limit] = getPaginationParams(req.query.page, 20);

  const d = await ne.brokerGetAgreements(username, skip, limit);
  d.agreements = d.agreements.map((agreement) => {
    if (new Date(agreement.end_date) < new Date()) {
      return { ...agreement, status: "expired" };
    }
    return agreement;
  });

  const page = paginate2(d.agreements, d.total, skip, limit, req.query.page);
  res.render("broker/list", {
    activePage: "pending",
    page,
    displayDate,
  });
};

/**
 * Handler to accept a specific agreement.
 *
 * This takes a pending agreement and accepts it.
 *
 * ## Parameters
 * - `agreementId`: The agreement to accept.
 *
 * ## Success
 * Redirects to the current user's profile page.
 *
 * ## Errors
 * - 404 Not Found if the `agreementId` does not exist.
 * - 403 Unauthorized if the current user is not the subject of the agreement.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.acceptAgreement = async (req, res) => {
  const { agreementId } = req.params;
  const { username } = req.user;

  const agreement = await ne.brokerGetAgreement(username, agreementId);
  if (!agreement) {
    throw new ExpressError("Agreement not found", 404);
  }
  if (
    agreement.status != "pending" ||
    !(agreement.representant == username || agreement.represented == username)
  ) {
    throw new ExpressError("Not authorized to accept this agreement", 403);
  }

  await ne.brokerAcceptAgreement(username, agreementId);

  req.flash("success", "Successfully accepted agreement");
  res.redirect(`${req.app.locals.baseUrl}/broker`);
};

/**
 * Cancels either a pending or active agreement.
 *
 * ## Parameters
 * - `agreementId`: ID of the agreement.
 *
 * ## Success
 * Cancels the agreement and redirects to the current user's profile.
 *
 * ## Errors
 * - 404 Not Found if the `agreementId` cannot be found.
 * - 403 Unauthorized if the current user is not an agent or subject of the
 *   agreement.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.rejectAgreement = async (req, res) => {
  const { username } = req.user;
  const { agreementId } = req.params;

  const agreement = await ne.brokerGetAgreement(username, agreementId);
  if (!agreement) {
    throw new ExpressError("Agreement not found", 404);
  }
  if (
    agreement.status != "pending" ||
    !(agreement.representant == username || agreement.represented == username)
  ) {
    throw new ExpressError("Not authorized to accept this agreement", 403);
  }

  await ne.brokerRejectAgreement(username, agreementId);

  req.flash("success", "Successfully rejected agreement");
  res.redirect(`${req.app.locals.baseUrl}/broker`);
};
