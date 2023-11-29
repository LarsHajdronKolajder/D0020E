const Notification = require("../models/notification");
const ExpressError = require("../utils/ExpressError");
const { paginate2, getPaginationParams } = require("../lib/paginate");

const getRecent = async (userId) => {
  const notifications = await Notification.find({
    user: userId,
    seen: false,
    createdAt: { $lte: Date.now() },
  })
    .sort("createdAt")
    .limit(8)
    .exec();

  return notifications;
};

const getUnhandled = async (userId) => {
  const numUnhandled = await Notification.countDocuments({
    user: userId,
    seen: false,
    createdAt: { $lte: Date.now() },
  });
  return numUnhandled;
};

/**
 * Middleware that adds the most recent notifications and the number of
 * unhandled notifications.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
module.exports.notificationMiddleware = (req, res, next) => {
  const setCount = async (user) => {
    if (!user) return;

    const [recent, count] = await Promise.all([
      getRecent(user._id),
      getUnhandled(user._id),
    ]);
    return { recent, count };
  };

  res.locals.notifications = null;
  setCount(res.locals.currentUser)
    .then((data) => {
      res.locals.notifications = data;
      next();
    })
    .catch(next);
};

module.exports.list = async (req, res) => {
  const { _id } = req.user;
  const [skip, limit] = getPaginationParams(req.query.page, 20);

  const [notifications, total] = await Promise.all([
    Notification.find({ user: _id, createdAt: { $lte: Date.now() } })
      .sort("createdAt")
      .skip(skip)
      .limit(limit)
      .exec(),
    Notification.countDocuments({ user: _id }),
  ]);

  res.render("notifications/list", {
    page: paginate2(notifications, total, skip, limit, req.query),
  });
};

module.exports.redirect = async (req, res) => {
  const { id: notificationId } = req.params;
  const { _id } = req.user;

  const notification = await Notification.findById(notificationId);
  if (notification.user != _id) {
    throw new ExpressError("Not your notification", 403);
  }
  notification.seen = true;
  await notification.save();

  res.redirect(`${req.app.locals.baseUrl}/${notification.links_to}`);
};

module.exports.mark_all_as_read = async (req, res) => {
  const { redirect } = req.query;
  const { _id } = req.user;

  await Notification.updateMany({ user: _id }, { $set: { seen: true } });

  if (redirect) {
    res.redirect(`${req.app.locals.baseUrl}${redirect}`);
  } else {
    res.redirect(`${req.app.locals.baseUrl}/notifications`);
  }
};
