var express = require("express");
var router = express.Router();
const passport = require("passport");
const userModel = require("../models/users");


router.post("/register", function (req, res) {
  console.log("REGISTER ROUTE HIT");
  console.log(req.body);

  const { username, email, fullname, password } = req.body;

  userModel
    .register(
      new userModel({ username, email, fullname }),
      password
    )
    .then(() => {
      console.log("REGISTER SUCCESS → REDIRECT LOGIN");
      res.redirect("/login");
    })
    .catch(err => {
      console.log("REGISTER ERROR:", err);
      res.redirect("/register");
    });
});


router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true
  })
);


router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/login");
  });
});

module.exports = router;
