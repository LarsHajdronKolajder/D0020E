const Offer = require("../models/offer");
const Notification = require("../models/notification");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const ne = require("../lib/ne");
const {
  displayDate,
  validateCreatePublicAuction,
  validateCreateFromMultipleOffers,
} = require("../lib/auction");
const { paginate2, getPaginationParams } = require("../lib/paginate");
const { getCoordinatesFromLocation } = require("../lib/location");
const ExpressError = require("../utils/ExpressError");

/**
 * Display a single auction.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.show = async (req, res) => {
  const { id: auctionId } = req.params;
  const { username, role } = req.user;

  // Fetch auction information.
  const auction = await ne.getAuction(username, auctionId, role === "broker");

  let adminMember;
  const memberUsernames = [];
  const offerIds = [];
  for (const member of auction.members) {
    memberUsernames.push(member.username);
    if (member.offer_id) {
      offerIds.push(member.offer_id);
    }
    if (member.is_room_admin) {
      adminMember = member;
    }
  }

  const isCreator =
    username == adminMember.username || username == adminMember.represented_by;

  // Broker options.
  const broker = {
    canRepresent: [],
    isRepresenting: undefined,
    joinAs: [{ username, brokerId: "" }],
  };
  let agreements = [];
  if (role == "broker") {
    agreements = await ne.getRepresenting(username);
    const agreementsWith = {};
    agreements.forEach(
      (agreement) => (agreementsWith[agreement.represented] = agreement)
    );

    // Check if the user is representing someone, and also which users the broker can represent.
    for (const member of auction.members) {
      const agreement = agreementsWith[member.username];
      if (!agreement) continue;

      if (member.represented_by == username) {
        broker.isRepresenting = {
          username: member.username,
          agreementId: agreement._id,
        };
      } else if (member.represented_by == "") {
        broker.canRepresent.push({
          username: member.username,
          agreementId: agreement._id,
        });
      }
    }
  }

  if (auction.privacy == "private") {
    const offers = await Offer.find({ _id: { $in: offerIds } }).exec();

    const bidByUsername = {};
    auction.bids.forEach((bid) => (bidByUsername[bid.sender] = bid));

    const offerById = {};
    offers.forEach((offer) => (offerById[offer._id] = offer));

    const membersWithOffers = auction.members.map((member) => ({
      ...member,
      offer: offerById[member.offer_id],
      bid: bidByUsername[member.username],
    }));

    res.render("auctions/show-multiple-offers", {
      auction,
      offers,
      members: membersWithOffers,
      formatDistanceToNow,
      displayDate,
      isCreator,
      broker,
    });
  } else {
    // Public auction with a single offer.
    const offer = await Offer.findById(auction.articleno);

    let userParticipates = broker.isRepresenting != undefined;
    if (!userParticipates) {
      for (let member of auction.members) {
        if (member.username === req.user.username) {
          userParticipates = true;
          break;
        }
      }

      // Check which users the broker can join as.
      const inAuction = {};
      auction.members.forEach((member) => (inAuction[member.username] = true));

      for (const agreement of agreements) {
        const represented = agreement.represented;
        if (represented && !inAuction[represented]) {
          broker.joinAs.push({
            username: represented,
            brokerId: agreement._id,
          });
        }
      }
    }

    res.render("auctions/show-public", {
      auction,
      offer,
      formatDistanceToNow,
      displayDate,
      userParticipates,
      isCreator,
      broker,
    });
  }
};

/**
 * Fetch auctions that are active, that you created or participate in
 * indexpage.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.index = async (req, res) => {
  const { username, role } = req.user;
  const [skip, limit] = getPaginationParams(req.query.page, 20);

  let agreements = [];
  if (role == "broker") {
    agreements = await ne.getRepresenting(username);
  }

  let auctions, total;
  if (role === "broker" && req.query.user) {
    const user = req.query.user;
    const representing = agreements.map((agreement) => agreement.represented);

    if (representing.includes(user)) {
      [auctions, total] = await ne.getActiveAuctions(user, skip, limit);
    } else {
      throw new ExpressError(
        "Cannot view a user you are not representing",
        403
      );
    }
  } else {
    [auctions, total] = await ne.getActiveAuctions(
      username,
      skip,
      limit,
      role == "broker"
    );
  }

  res.render("auctions/list", {
    page: paginate2(auctions, total, skip, limit, req.query),
    formatDistanceToNow,
    agreements,
  });
};

/**
 * Fetch list of all completed auctions and render template.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.history = async (req, res) => {
  const { username } = req.user;
  const [skip, limit] = getPaginationParams(req.query.page, 20);
  const [auctions, total] = await ne.getAuctionHistory(username, skip, limit);

  res.render("auctions/history", {
    page: paginate2(auctions, total, skip, limit, req.query),
    displayDate,
  });
};

/**
 * Show a list of public auctions.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.listPublic = async (req, res) => {
  const { username } = req.user;
  const [skip, limit] = getPaginationParams(req.query.page, 20);
  const [auctions, total] = await ne.getPublicAuctions(username, skip, limit);

  res.render("auctions/list-public", {
    page: paginate2(auctions, total, skip, limit, req.query),
    displayDate,
  });
};

/**
 * Renders the page to create a public auction from one of the user's offers.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.renderCreatePublicAuction = async (req, res) => {
  const { offerId } = req.query;

  // Otherwise it's from a single owned offer.
  const { offer, auctionType, brokerAgreement } =
    await validateCreatePublicAuction(req.user, offerId);
  const contracts = await ne.contractList("auction");

  res.render("auctions/create-public", {
    offer,
    auctionType,
    contracts,
    brokerAgreement,
  });
};

/**
 * Creates a public auction.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.createPublicAuction = async (req, res) => {
  const { username } = req.user;

  try {
    const offerId = req.body.offerId;

    // Have to ensure the offer exists.
    const { offer, auctionType, brokerAgreement } =
      await validateCreatePublicAuction(req.user, offerId);
    let brokerAgreementId = "";
    if (brokerAgreement) {
      brokerAgreementId = brokerAgreement._id;
    }

    const data = {
      room_name: req.body.auctionTitle,
      privacy: "public",
      auction_type: auctionType,
      closing_time: new Date(req.body.closingTime).toISOString(),
      reference_sector: offer.referenceSector,
      reference_type: offer.referenceType,
      quantity: parseInt(req.body.quantity),
      unit: req.body.unit,
      offer_id: offerId,
      templatetype: req.body.contract,
      location: offer.geometry.coordinates,
      members: [],
      broker_id: brokerAgreementId,
    };
    const auctionId = await ne.createAuction(username, data);

    req.flash("success", "Successfully created auction");
    res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
  } catch (error) {
    if (error.isAxiosError) {
      console.error(error.response.data);
    } else {
      console.error(error);
    }

    req.flash("error", "Failed to create auction");
    res.redirect(`${req.app.locals.baseUrl}/auctions`);
  }
};

/**
 * Renders the page to create auctions.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.renderCreateAuction = async (req, res) => {
  const { offerIds } = req.query;
  const { username, role } = req.user;

  // Check if we should render the template for that contains multiple non-owned offers.
  const { offers, ...rest } = await validateCreateFromMultipleOffers(
    username,
    offerIds
  );
  const contracts = await ne.contractList("auction");

  let agreements = [];
  if (role == "broker") {
    agreements = await ne.getRepresenting(username);
  }

  res.render("auctions/create-multiple-offers", {
    offers,
    info: { ...rest },
    offerIds: offerIds.join(","),
    contracts,
    agreements,
  });
};

/**
 * Create a multiple-offer auction.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.createAuction = async (req, res) => {
  const { username, role } = req.user;

  if (role === "broker" && req.body.offerId && req.body.offerId.length == 0) {
    throw new ExpressError("As a broker you must represent someone", 400);
  }

  try {
    const { offers, sector, type, auctionType } =
      await validateCreateFromMultipleOffers(username, req.body.offerIds);

    const members = offers.map((offer) => ({
      username: offer.author.username,
      location: offer.geometry.coordinates,
      offer_id: offer._id,
    }));

    const {
      auctionTitle,
      closingTime,
      quantity,
      unit,
      location,
      contract,
      brokerId,
    } = req.body;
    const coordinates = await getCoordinatesFromLocation(location);

    const data = {
      room_name: auctionTitle,
      privacy: "private",
      auction_type: auctionType,
      closing_time: new Date(closingTime).toISOString(),
      reference_sector: sector,
      reference_type: type,
      quantity: parseInt(quantity),
      unit,
      offer_id: "",
      templatetype: contract,
      location: coordinates,
      members: members,
      broker_id: brokerId ? brokerId : "",
    };
    const auctionId = await ne.createAuction(username, data);

    // Create notifications for members.
    const notifications = [];
    for (const offer of offers) {
      notifications.push({
        user: offer.author,
        category: "Auction",
        message: `You have been invited to auction ${auctionTitle}`,
        links_to: `auctions/${auctionId}`,
        seen: false,
      });
    }
    await Notification.insertMany(notifications);

    req.flash("success", "Successfully created auction");
    res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
  } catch (error) {
    if (error.isAxiosError) {
      console.error(error.response.data);
    } else {
      console.error(error);
    }

    req.flash("error", "Failed to create auction");
    res.redirect(`${req.app.locals.baseUrl}/auctions`);
  }
};

const showAuctionEnded = async (
  req,
  res,
  username,
  auctionId,
  auction,
  offerIds
) => {
  // We want to display a winning offer here.
  // For the single-offer auction we displayed the auctioned offer.
  // For multiple-offer auction we display the winning offer.

  let offer;
  if (offerIds.length > 1) {
    const offers = await Offer.find({ _id: { $in: offerIds } })
      .populate("author")
      .exec();

    // Get the offer of the highest bidder.
    const highestBidder = auction.payload.highest_bidder.val[0];
    for (let potentialOffer of offers) {
      if (potentialOffer.author.username === highestBidder) {
        offer = potentialOffer;
        break;
      }
    }
  } else {
    offer = await Offer.findById(offerIds[0]).populate("author");
  }

  const contract = await ne.getWinner(
    username,
    auctionId,
    offer.id,
    offer.title
  );

  res.render("auctions/auction-ended-auctioneer-view", {
    contract,
    auction,
    offer,
    displayDate,
  });
};

/**
 * Place a single bid to Negotiation Engine and refresh the page to display.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.placeBid = async (req, res) => {
  const { id: auctionId } = req.params;
  const { bid } = req.body;
  const { username } = req.user;

  try {
    if (bid <= 0) {
      req.flash("error", "Invalid bid.");
      res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
    } else {
      await ne.placeBid(username, auctionId, bid);
      req.flash("success", `Successfully placed bid: ${bid}`);
      res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
    }
  } catch (error) {
    if (error.isAxiosError) {
      req.flash("error", error.response.data.message);
    } else {
      req.flash("error", "Failed to place bid.");
    }
    res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
  }
};

/**
 * Join a public auction.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.join = async (req, res) => {
  const { id: auctionId } = req.params;
  const { username } = req.user;
  const { location, brokerId } = req.body;

  // Check that we can join the auction.
  const auction = await ne.getAuction(username, auctionId);
  if (auction.privacy !== "public") {
    throw new ExpressError("Cannot join private auction", 403);
  }

  for (let member of auction.members) {
    if (member.username === username) {
      throw new ExpressError(
        `Already a member of auction ${auction.payload.name.val[0]}`,
        400
      );
    }
  }
  const locationCoordinates = await getCoordinatesFromLocation(location);

  // Join the auction.
  await ne.joinAuction(username, auctionId, locationCoordinates, brokerId);

  req.flash("success", `Successfully joined auction ${auction.room_name}`);
  res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
};

module.exports.represent = async (req, res) => {
  const { username } = req.user;
  const { id: auctionId } = req.params;
  const { brokerId } = req.body;

  try {
    ne.representInAuction(username, auctionId, brokerId);
    req.flash("success", `Successfully represented user in auction`);
  } catch (err) {
    req.flash("error", `Could not represent user in auction`);
  }
  res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
};

/**
 * Show page to invite new members to an ongoing auction.
 *
 * TODO: Should probably support multiple pages.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.showInvite = async (req, res) => {
  const { username, role } = req.user;
  const { id: auctionId } = req.params;

  const auction = await ne.getAuction(username, auctionId, role === "broker");
  const usernameExistsInAuction = {};
  for (const member of auction.members) {
    usernameExistsInAuction[member.username] = true;
  }

  let offers = await Offer.find({
    referenceSector: auction.reference_sector,
    referenceType: auction.reference_type,
  }).populate("author");

  // Filter out all offers by people already in the auction.
  offers = offers.filter(
    (offer) => !usernameExistsInAuction[offer.author.username]
  );

  res.render("auctions/invite", { auction, offers });
};

/**
 * Invite members to an ongoing auction.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.performInvite = async (req, res) => {
  const { username, role } = req.user;
  const { id: auctionId } = req.params;
  const { offerId } = req.body;

  const offer = await Offer.findById(offerId).populate("author");
  await ne.auctionInvite(
    auctionId,
    username,
    offer.author.username,
    offer.geometry.coordinates,
    offer._id
  );

  const auction = ne.getAuction(username, auctionId, role === "broker");
  // Create notification for new member.
  const notification = new Notification({
    user: offer.author,
    category: "Auction",
    message: `You have been invited to auction ${auction.room_name}`,
    links_to: `auctions/${auctionId}`,
    seen: false,
  });
  await notification.save();

  res.redirect(`${req.app.locals.baseUrl}/auctions/${auctionId}`);
};
