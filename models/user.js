var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose"),
    Invoice = require("./invoice.js");
var userSchema = new mongoose.Schema({
    username: String,
    port_id: String,
    company_id: String,
    email_id: String,
    password: String,
    credit: Number,
    total_outstanding: Number,
    invoices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "invoices"
    }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("users", userSchema);