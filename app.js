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
    User = require("./models/user"),
    Invoice = require("./models/invoice");

var userRoute = require("./routes/userRoutes");
var adminRoute = require("./routes/adminRoutes");
var authRoute = require("./routes/authRoutes");
var paymentRoute = require("./routes/paymentRoutes");

require("dotenv").config();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(__dirname + "/views"));

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

var DATABASEURL = process.env.DATABASEURL || "mongodb://localhost/adani_users";
mongoose.connect(DATABASEURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("DataBase Connected!");
}).catch(() => {
    console.log("DataBase not Connected!");
})

//ROUTES
app.use(authRoute);
app.use(userRoute);
app.use(adminRoute);
app.use(paymentRoute);
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


//SERVER LISTENING ROUTE

var PORT = process.env.PORT || 3000;

app.listen(PORT, (req, res) => {
    console.log("server started at: " + PORT);
});