const Message = require("../models/messages");
const User = require("../models/user");
const Notification = require("../models/notification");

const ExpressError = require("../utils/ExpressError");
const { displayDate } = require("../lib/auction");
const { paginate2, getPaginationParams } = require("../lib/paginate");

/**
 * Create and send a message to a recipient.
 *
 * Expects a JSON body containing
 * ```json
 * {
 *   "username": "",
 *   "title": "",
 *   "body": ""
 * }
 * ```
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.create = async (req, res) => {
  const { _id: from, username: fromUsername } = req.user;
  const { username: toUsername, title, body } = req.body;

  const toUser = await User.findOne({ username: toUsername });
  if (!toUser) {
    throw new ExpressError(
      `Cannot send to ${toUsername}: not a valid user`,
      400
    );
  }

  const message = new Message({
    from,
    to: toUser._id,
    replyingTo: undefined,
    title,
    body,
    read: false,
    marked: false,
  });
  await message.save();

  const notification = new Notification({
    user: toUser._id,
    category: "Message",
    message: `New messsage from ${fromUsername}`,
    links_to: `messages/${message._id}`,
    seen: false,
  });
  await notification.save();

  req.flash("success", `Successfully sen message to ${toUsername}`);
  res.redirect(`${req.app.locals.baseUrl}/messages/${message.id}`);
};

const getSearchFilter = (id, filter) => {
  if (filter == "unread") {
    return { to: id, read: false };
  }
  if (filter == "read") {
    return { to: id, read: true };
  }
  if (filter == "marked") {
    return { to: id, marked: true };
  }
  if (filter == "sent") {
    return { from: id };
  }
  return { to: id };
};

const filters = [
  {
    query: "",
    filter: undefined,
    name: "All messages",
  },
  {
    query: "?filter=unread",
    filter: "unread",
    name: "Unread messages",
  },
  {
    query: "?filter=read",
    filter: "read",
    name: "Read messages",
  },
  {
    query: "?filter=mark",
    filter: "mark",
    name: "Marked messages",
  },
  {
    query: "?filter=sent",
    filter: "sent",
    name: "Sent messages",
  },
];

/**
 * List all messages.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.list = async (req, res) => {
  const { _id } = req.user;
  const { filter } = req.query;
  const [skip, limit] = getPaginationParams(req.query.page, 10);

  let filterBy = getSearchFilter(_id, filter);
  const [messages, total] = await Promise.all([
    Message.find(filterBy)
      .populate("from")
      .populate("to")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filterBy),
  ]);

  res.render("messages/list", {
    page: paginate2(messages, total, skip, limit, req.query),
    displayDate,
    filter,
    filters,
  });
};

/**
 * Show a single conversation.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.show = async (req, res) => {
  const { id } = req.params;

  const message = await Message.findById(id)
    .populate("from")
    .populate("to")
    .exec();

  if (message.replyingTo) {
    message.replyingTo = await Message.findById(message.replyingTo)
      .populate("from")
      .populate("to")
      .exec();
  }

  if (message.read == false && message.to.username === req.user.username) {
    await Message.updateOne({ _id: id }, { read: true });
  }

  res.render("messages/show", { message, displayDate });
};

/**
 * Post a reply in a conversation.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.reply = async (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;
  const { _id: userId, username } = req.user;

  const message = await Message.findById(id).exec();
  if (!message.to == userId) {
    throw new ExpressError("Cannot reply to other people's messages", 403);
  }

  const reply = new Message({
    from: userId,
    to: message.from,
    replyingTo: message._id,
    title: title,
    body,
    read: false,
    marked: false,
  });
  await reply.save();

  const notification = new Notification({
    user: message.from,
    category: "Message",
    message: `New messsage from ${username}`,
    links_to: `messages/${reply._id}`,
    seen: false,
  });
  await notification.save();

  req.flash("Success", "Message sent!");
  res.redirect(`${req.app.locals.baseUrl}/messages`);
};

/**
 * Mark a message to keep track of.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.mark = async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const message = await Message.findById(id).exec();
  if (message.to != userId) {
    throw new ExpressError("Cannot modify other people's messages", 403);
  }
  message.marked = !message.marked;
  await message.save();

  req.flash("Success", `Marked message ${message.title}`);
  res.redirect(`${req.app.locals.baseUrl}/messages`);
};
