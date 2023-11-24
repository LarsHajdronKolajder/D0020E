const User = require("../models/user");
const Offer = require("../models/offer");
const Profile = require("../models/profile");
const ExpressError = require("../utils/ExpressError");
const { getPage, createPagination } = require("../lib/paginate");
const ne = require("../lib/ne");

/**
 * Shows a user's profile page.
 *
 * Throws a 404 if the username cannot be found.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.show = async (req, res) => {
  const { role, username } = req.user;
  const { username: otherUsername } = req.params;

  const user = await User.findOne({ username: otherUsername });
  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  let [profile, offers] = await Promise.all([
    Profile.findOne({ user: user._id }),
    Offer.find({ author: user._id }).countDocuments(),
  ]);

  // Profiles are lazily created, so if it cannot be found for a valid user,
  // pass along an empty object.
  if (!profile) {
    profile = {};
  }

  const active = 0;
  const wins = 0;
  // const auctions = await ne.getAuctionHistory(otherUsername);
  // const wins = auctions.reduce((acc, auction) => {
  //   if (auction.payload.highest_bidder.val[0] === otherUsername) {
  //     return acc + 1;
  //   } else {
  //     return acc;
  //   }
  // }, 0);

  const broker = {
    canHaveAgreement: false,
    agreementCount: 0,
  };
  if (username != otherUsername && role != user.role) {
    broker.canHaveAgreement = true;
    let agreements = await ne.brokerGetAgreementsBetween(
      username,
      otherUsername
    );
    agreements = agreements.filter((agreement) => {
      return new Date(agreement.end_date) >= new Date();
    });
    broker.agreementCount = agreements.length;
  }

  res.render("profile/show", {
    user,
    profile,
    wins,
    active,
    offers,
    broker,
  });
};

/**
 * Shows the edit profile page.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.edit = async (req, res) => {
  const { _id } = req.user;

  let profile = await Profile.findOne({ user: _id });
  if (!profile) {
    profile = {};
  }

  res.render("profile/edit", {
    profile,
  });
};

/**
 * Handles updating a user's profile.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.update = async (req, res) => {
  const { _id, username, role } = req.user;
  const data = {
    firstname: req.body.firstname,
    surname: req.body.surname,
    phone: req.body.phone,
    address: req.body.address,
    postcode: req.body.postcode,
    area: req.body.area,
    country: req.body.country,
    state: req.body.state,
    description: req.body.description,
    company: req.body.company,
  };

  // Check if user updates their role.
  if (role != req.body.role) {
    const [active, pending] = await Promise.all([
      ne.brokerGetActiveAgreements(username, 0, 1),
      ne.brokerGetPendingAgreements(username, 0, 1),
    ]);
    if (active.total > 0 || pending.total > 0) {
      throw new ExpressError(
        "Cannot change role with pendign or active broker agreements",
        400
      );
    }
    // Update user model.
    await User.findOneAndUpdate({ _id }, { role: req.body.role });

    // Update session data.
    req.session.passport.user.role = req.body.role;
    req.session.save();
  }

  await Profile.findOneAndUpdate({ user: _id }, data, { upsert: true });

  req.flash("success", "Successfully updated profile");
  res.redirect(`${req.app.locals.baseUrl}/profile/${username}`);
};

/**
 * View all of a user's offers.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.offers = async (req, res) => {
  const { username } = req.params;
  const page = getPage(req.query.page);
  const perPage = 18;

  const user = await User.findOne({ username });
  const [offers, count] = await Promise.all([
    Offer.find({ author: user._id, deleted: false })
      .populate("author")
      .sort({ _id: 1 })
      .skip(perPage * (page - 1))
      .limit(perPage),
    Offer.countDocuments({ author: user._id }),
  ]);

  res.render("profile/offers", {
    username,
    page: createPagination(offers, count, page, perPage),
  });
};
