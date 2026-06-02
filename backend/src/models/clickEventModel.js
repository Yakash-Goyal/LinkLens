const { mongoose } = require("../config/mongo");

const clickEventSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    hashedIp: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "bot", "unknown"],
      default: "unknown",
    },
    referrer: {
      type: String,
      default: "direct",
      trim: true,
    },
  },
  {
    collection: "click_events",
    versionKey: false,
  }
);

clickEventSchema.index({ shortCode: 1, timestamp: -1 });
clickEventSchema.index({ shortCode: 1, hashedIp: 1 });

module.exports =
  mongoose.models.ClickEvent ||
  mongoose.model("ClickEvent", clickEventSchema);
