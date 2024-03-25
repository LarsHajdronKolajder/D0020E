const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String,
});

ImageSchema.virtual("thumbnail").get(function () {
    return this.url.replace("/upload", "/upload/w_200");
});

const opts = { toJSON: { virtuals: true } };

const HistorySchema = new Schema(
    {
        title: String,
        man_code: String,
        images: [ImageSchema],
        geometry: {
            type: {
                type: String,
                enum: ["Point"],
                require: true,
            },
            coordinates: {
                type: [Number],
                require: true,
            },
        },
        price: Number,
        unit: String,
        description: String,
        costumer: {
            type: String,
            // lowercase: true,
            enum: ["Supply", "Demand"],
        },
        referenceSector: {
            type: String,
            // lowercase: true,
            //enum: ["Composites", "Batteries"],
        },
        referenceType: {
            type: String,
            // lowercase: true,
            //enum: ["Material", "Product"],
        },
        location: String,
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        api_creation: Date,
        api_refurb: Number,
        api_dateRefurb: Date,
        api_descriptionRefurb: String,

    },
    opts
);

module.exports = mongoose.model("History", HistorySchema);
