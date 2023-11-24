const Offer = require("../models/offer");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  const review = new Review(req.body.review);
  review.author = req.user._id;

  offer.reviews.push(review);

  await review.save();
  await offer.save();

  req.flash("success", "Created new review!");
  res.redirect(`${req.app.locals.baseUrl}/offers/${offer._id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Offer.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Successfully deleted review!");
  res.redirect(`${req.app.locals.baseUrl}/offers/${id}`);
};
