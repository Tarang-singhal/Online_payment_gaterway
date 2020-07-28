var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Invoice = require("../models/invoice");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var bodyParser = require("body-parser");

//REGISTER ROUTE
router.get("/home/register", (req, res) => {
    res.render("register", { currentUser: req.user });
});
//POST REGISTER ROUTE
router.post("/home/register", (req, res) => {
    console.log(req.body);
    console.log(req.params);
    User.register(new User({ username: req.body.username }), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.redirect("/home/register");
        }
        passport.authenticate("local")(req, res, function() {
            User.findById(user._id, function(err, userFound) {
                userFound.port_id = req.body.port_id;
                userFound.company_id = req.body.company_id;
                userFound.email_id = req.body.email_id;
                userFound.credit = 0;
                userFound.total_outstanding = 0;
                userFound.save(function(err, newUser) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/home/dashboard");
                    }
                });
            });
        });
    });
});

//LOGIN ROUTE
router.get("/home/login", (req, res) => {
    res.render("login", { currentUser: req.user });
});

//POST LOGIN ROUTE
router.post("/home/login", passport.authenticate("local", {
    successRedirect: "/home/dashboard",
    failureRedirect: "/home/login"
}), function(req, res) {});

//LOGOUT ROUTE
router.get("/home/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

//FUNCTION TO CHECK LOGGEDIN
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/home/login");
};

//FUNCTION TO CHECK LOGGEDINHISTORY
function isLoggedInHistory(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/home/dashboard/history");
};

module.exports = router;