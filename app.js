//REQUIRED VARIABLES
var express = require("express"),
    app = express(),
    session = require("express-session"),
    bodyParser = require("body-parser"),
    cors = require("cors"),
    ejs = require("ejs"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User = require("./models/user");
require("dotenv").config();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(__dirname + "/views"));
const { initPayment, responsePayment } = require("./paytm/services/index");

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect("mongodb://localhost/adani_users", {
// mongoose.connect(process.env.DATABASEURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(session({
    secret: "whatever u want",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//ROUTES
//INDEX PAGE
app.get("/", (req, res) => {
    res.redirect("/home");
});

//HOME PAGE
app.get("/home", (req, res) => {
    res.render("landing", { currentUser: req.user });
});

//ABOUT PAGE
app.get("/home/about", (req, res) => {
    res.render("about", { currentUser: req.user });
});

//REGISTER ROUTE
app.get("/home/register", (req, res) => {
    res.render("register", { currentUser: req.user });
});
//POST REGISTER ROUTE
app.post("/home/register", (req, res) => {
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
app.get("/home/login", (req, res) => {
    res.render("login", { currentUser: req.user });
});

//POST LOGIN ROUTE
app.post("/home/login", passport.authenticate("local", {
    successRedirect: "/home/dashboard",
    failureRedirect: "/home/login"
}), function(req, res) {});

//LOGOUT ROUTE
app.get("/home/logout", (req, res) => {
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

//DASHBOARD ROUTES
app.get("/home/dashboard", isLoggedIn, (req, res) => {
    res.render("dashboard", { currentUser: req.user });
});

//CREDIT ROUTE
app.get("/home/dashboard/credit", isLoggedIn, (req, res) => {
    res.render("credit", { currentUser: req.user });
});

//History ROUTE
app.get("/home/dashboard/history", isLoggedInHistory, (req, res) => {
    res.render("history", { currentUser: req.user });
});

//ADMIN ROUTE
app.get("/home/dashboard/admin", isLoggedIn, (req, res) => {
    res.render("admin", { currentUser: req.user });
});

//POST ADMIN ROUTE
app.post("/home/dashboard/admin", isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, userFound) => {
        userFound.invoices.push({
            invoice_amount: req.body.invoice_amount,
            paid: false,
            description: req.body.description
        });
        userFound.total_outstanding = parseInt(userFound.total_outstanding) + parseInt(req.body.invoice_amount);
        userFound.save((err, user) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/home/dashboard");
            }
        })
    });
});

//PAYMENT CHOICE ROUTE
app.get("/home/dashboard/payment", isLoggedIn, (req, res) => {
    res.render("choice", { currentUser: req.user });
});

//PARTIAL PAYMENT ROUTE
app.get("/home/dashboard/payment/partial", isLoggedIn, (req, res) => {
    res.render("partial", { currentUser: req.user });
});

//USE CREDIT PAYMENT ROUTE
app.get("/home/dashboard/payment/usecredit", isLoggedIn, (req, res) => {
    res.render("usecredit", { currentUser: req.user });
});

//POST USE CREDIT PAYMENT ROUTE
app.post("/home/dashboard/payment/usecredit", isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            user.credit = parseInt(user.credit) - parseInt(req.body.amount);
            user.total_outstanding = parseInt(user.total_outstanding) - parseInt(req.body.amount);
            user.save();
        }
    });
    res.redirect("/home/dashboard");
});

//COMPLETE PAYMENT ROUTE
app.get("/home/dashboard/payment/complete", isLoggedIn, (req, res) => {
    res.render("complete", { currentUser: req.user });
});

//PAYTM PAY ROUTE
var deducted_amount = 0;
var a = 0;
app.get("/paywithpaytm", isLoggedIn, (req, res) => {
    if (req.query.amount) {
        deducted_amount = parseInt(req.query.amount);
        a = parseInt(req.query.amount);
    } else {
        a = parseInt(req.query.amount2)
        deducted_amount = 0;
    }
    initPayment(a).then(
        success => {
            res.render("paytmRedirect.ejs", {
                resultData: success,
                paytmFinalUrl: process.env.PAYTM_FINAL_URL,
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
app.post("/paywithpaytmresponse", isLoggedIn, (req, res) => {
    responsePayment(req.body).then(
        success => {
            User.findById(req.user._id, (err, user) => {
                if (err) {
                    console.log(err);
                } else {
                    if (parseInt(deducted_amount) !== 0) {
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

//SERVER LISTENING ROUTE
app.listen(process.env.PORT, (req, res) => {
    console.log("server started at: " + process.env.PORT);
});