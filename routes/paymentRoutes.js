var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Invoice = require("../models/invoice");
var config = require("../paytm/config");
const { initPayment, responsePayment } = require("../paytm/services/index");

//PAYMENT CHOICE ROUTE
router.get("/home/dashboard/status/:id", isLoggedIn, (req, res) => {
    res.render("choice", { id: req.params.id, currentUser: req.user });
});

//PARTIAL PAYMENT ROUTE
router.get("/home/dashboard/payment/:id/partial", isLoggedIn, (req, res) => {
    Invoice.findById(req.params.id, (err, invoice) => {
        if (err) {
            console.log(err);
        } else {
            res.render("partial", { currentUser: req.user, currentInvoice: invoice });
        }
    });
});

//USE-CREDIT PAYMENT ROUTE
router.get("/home/dashboard/payment/:id/usecredit", isLoggedIn, (req, res) => {
    Invoice.findById(req.params.id, (err, invoice) => {
        if (err) {
            console.log(err);
        } else {
            res.render("usecredit", { currentUser: req.user, currentInvoice: invoice });
        }
    });
});

//POST USE CREDIT PAYMENT ROUTE
router.post("/home/dashboard/payment/:id/usecredit", isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            Invoice.findById(req.params.id, (err, invoice) => {
                if (parseInt(req.user.credit) >= parseInt(req.body.amount)) {
                    if (parseInt(invoice.invoice_amount) >= parseInt(req.body.amount)) {
                        invoice.invoice_amount = parseInt(invoice.invoice_amount) - parseInt(req.body.amount);
                        invoice.save();
                        user.credit = parseInt(user.credit) - parseInt(req.body.amount);
                        user.total_outstanding = parseInt(user.total_outstanding) - parseInt(req.body.amount);
                        user.save();
                    } else {
                        res.send("Please enter amount less than or equal to " + parseInt(invoice.invoice_amount));
                    }
                } else {
                    res.send("Insufficient Credit");
                }
            });
        }
    });
    res.redirect("/home/dashboard");
});

//COMPLETE PAYMENT ROUTE
router.get("/home/dashboard/payment/:id/complete", isLoggedIn, (req, res) => {
    Invoice.findById(req.params.id, (err, invoice) => {
        if (err) {
            console.log(err);
        } else {
            res.render("complete", { currentUser: req.user, currentInvoice: invoice });
        }
    });
});

//PAYTM PAY ROUTE
var deducted_amount = 0;
router.get("/paywithpaytm/:id", isLoggedIn, (req, res) => {
    deducted_amount = parseInt(req.query.amount);
    a = 0;
    initPayment(deducted_amount).then(
        success => {
            Invoice.findById(req.params.id, (err, invoice) => {
                invoice.invoice_amount = parseInt(invoice.invoice_amount) - parseInt(deducted_amount);
                if (invoice.invoice_amount === 0) { invoice.paid = true; }
                invoice.save();
            });
            res.render("paytmRedirect.ejs", {
                resultData: success,
                paytmFinalUrl: config.PAYTM_FINAL_URL,
                currentUser: req.user
            });
        },
        error => {
            // Invoice.findById(req.params.id, (err, invoice) => {
            //     invoice.invoice_amount = parseInt(invoice.invoice_amount) + parseInt(deducted_amount);
            //     invoice.save();
            // });
            res.send(error);
            console.log(error);
        }
    );
});
var a = 0;
//ADD CREDITS IN ACCOUNT
router.get("/paywithpaytm", isLoggedIn, (req, res) => {
    a = parseInt(req.query.amount2);
    deducted_amount = 0;
    initPayment(a).then(
        success => {
            res.render("paytmRedirect.ejs", {
                resultData: success,
                paytmFinalUrl: config.PAYTM_FINAL_URL,
                currentUser: req.user
            });
        },
        error => {
            res.send(error);
            console.log(error);
        }
    );
});

//PAYTM RESPONSE ROUTE
router.post("/paywithpaytmresponse", isLoggedIn, (req, res) => {
    responsePayment(req.body).then(
        success => {
            User.findById(req.user._id, (err, user) => {
                if (err) {
                    console.log(err);
                } else {
                    if (parseInt(deducted_amount) != 0) {

                        user.total_outstanding = parseInt(user.total_outstanding) - parseInt(deducted_amount);
                        deducted_amount = 0;
                        a = 0;
                    } else {
                        user.credit = parseInt(user.credit) + parseInt(a);
                        a = 0;
                        deducted_amount = 0;
                    }
                    user.save();
                }
            });
            res.render("response.ejs", { resultData: "true", responseData: success });
        },
        error => {
            res.send(error);
        }
    );
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