const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MsgSchema = new Schema(
  {
    // User that sent the message.
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Recipient of the message.
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    replyingTo: {
      type: Schema.Types.ObjectId,
      ref: "Messages",
    },

    // Message title
    title: {
      type: String,
      required: true,
    },

    // Message body.
    body: {
      type: String,
      required: true,
    },

    // If the recipient has read the message.
    read: {
      type: Boolean,
      required: true,
    },

    // If the recipient marked the message.
    marked: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Messages", MsgSchema);
