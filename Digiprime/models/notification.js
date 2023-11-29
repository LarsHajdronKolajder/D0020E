const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Schema for a single notification.
 *
 * A notification should be displayed for each user when an action of interest
 * has occured that relates to the user.
 */
const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Category for notification.
    category: {
      type: String,
      enum: ["Auction", "Negotiation", "Message", "Broker"],
    },

    // Short message that summarizes what happened.
    message: String,

    // Where to re-direct the user when they click the notification.
    links_to: String,

    // If the user has "processed" this notification.
    seen: Boolean,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);
