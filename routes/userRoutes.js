var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Invoice = require("../models/invoice");
//DASHBOARD ROUTES
router.get("/home/dashboard", isLoggedIn, (req, res) => {
    res.render("dashboard", { currentUser: req.user });
});

//CREDIT ROUTE
router.get("/home/dashboard/credit", isLoggedIn, (req, res) => {
    res.render("credit", { currentUser: req.user });
});

//History ROUTE
router.get("/home/dashboard/history", isLoggedInHistory, (req, res) => {
    console.log(req.user);
    User.findById(req.user._id).populate('invoices').exec(function(err, user) {
        console.log(user);
        res.render("history", { currentUser: user });
    });
});


//INVOICES STATUS ROUTE
router.get("/home/dashboard/status", isLoggedIn, (req, res) => {
    User.findById(req.user._id).populate("invoices").exec((err, user) => {
        res.render("invoicestatus", { currentUser: user });
    });
    // res.render("choice", { currentUser: req.user });
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