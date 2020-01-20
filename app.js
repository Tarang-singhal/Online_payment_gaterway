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
// mongoose.connect("mongodb://localhost/adani_users", {
mongoose.connect(process.env.DATABASEURL, {
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

app.get("/home", (req, res) => {
    res.render("landing", { currentUser: req.user });
});

//REGISTER ROUTES
app.get("/home/register", (req, res) => {
    res.render("register", { currentUser: req.user });
});

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

//LOGIN ROUTES
app.get("/home/login", (req, res) => {
    res.render("login", { currentUser: req.user });
});

app.post("/home/login", passport.authenticate("local", {
    successRedirect: "/home/dashboard",
    failureRedirect: "/home/login"
}), function(req, res) {});

//LOGOUT ROUTE
app.get("/home/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/home/login");
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
app.get("/home/dashboard/history", isLoggedIn, (req, res) => {
    res.render("history", { currentUser: req.user });
});

//ADMIN
app.get("/home/dashboard/admin", isLoggedIn, (req, res) => {
    res.render("admin", { currentUser: req.user });
});

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

//PAYMENT
app.get("/home/dashboard/payment", isLoggedIn, (req, res) => {
    res.render("choice", { currentUser: req.user });
});

//PARTIAL
app.get("/home/dashboard/payment/partial", isLoggedIn, (req, res) => {
    res.render("partial", { currentUser: req.user });
});

//Complete
app.get("/home/dashboard/payment/complete", isLoggedIn, (req, res) => {
    res.render("complete", { currentUser: req.user });
});

//PAYTM
var deducted_amount = 0;
app.get("/paywithpaytm", isLoggedIn, (req, res) => {
    deducted_amount = parseInt(req.query.amount);
    initPayment(req.query.amount).then(
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

app.post("/paywithpaytmresponse", isLoggedIn, (req, res) => {
    responsePayment(req.body).then(
        success => {
            User.findById(req.user._id, (err, user) => {
                if (err) {
                    console.log(err);
                } else {
                    user.total_outstanding = parseInt(user.total_outstanding) - parseInt(deducted_amount);
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

app.listen(process.env.PORT, (req, res) => {
    console.log("server started at: " + process.env.PORT);
});