const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    console.log("Reached history route");
    res.render("../views/offers/history.ejs");
});

module.exports = router;

