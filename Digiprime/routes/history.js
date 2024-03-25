const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isValidId } = require("../middleware");
const historyController = require("../controllers/history");


router.get("/:id", isLoggedIn, isValidId, catchAsync(historyController.show))
router.get("/entireHistory/:id", isLoggedIn, isValidId, catchAsync(historyController.entireHistory))

module.exports = router;