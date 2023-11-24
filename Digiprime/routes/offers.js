const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const offers = require("../controllers/offers");
const {
  isLoggedIn,
  isAuthor,
  validateOffer,
  isValidId,
  sanitizeDirectoryQuery,
} = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

router
  .route("/")
  .get(catchAsync(offers.index))
  .post(
    isLoggedIn,
    upload.array("image"),
    validateOffer,
    catchAsync(offers.create)
  );

router.get("/directory", sanitizeDirectoryQuery, catchAsync(offers.directory));

router.get("/new", isLoggedIn, offers.newForm);

router.get("/dismitted", isLoggedIn, offers.dismitted);


router
  .route("/:id")
  .get(isValidId, catchAsync(offers.show))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("image"),
    validateOffer,
    catchAsync(offers.updateForm)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(offers.delete));

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(offers.editForm));

module.exports = router;
