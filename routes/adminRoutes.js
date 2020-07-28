var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Invoice = require("../models/invoice");
//ADMIN ROUTE
router.get("/home/dashboard/admin", isLoggedIn, (req, res) => {
    res.render("admin", { currentUser: req.user });
});

//POST ADMIN ROUTE
router.post("/home/dashboard/admin", isLoggedIn, (req, res) => {
    Invoice.create({
        invoice_amount: req.body.invoice_amount,
        actual_amount: req.body.invoice_amount,
        description: req.body.description,
        paid: false
    }, (err, invoice) => {
        if (err) {
            console.log(err);
        } else {
            User.findById(req.user._id, (err, userFound) => {
                userFound.invoices.push(invoice._id);
                userFound.total_outstanding = parseInt(userFound.total_outstanding) + parseInt(req.body.invoice_amount);
                userFound.save((err, user) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/home/dashboard");
                    }
                })
            });
        }
    });
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