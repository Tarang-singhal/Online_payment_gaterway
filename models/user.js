var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var invoiceSchema = new mongoose.Schema({
    invoice_amount: Number,
    paid: Boolean,
    description: String,
    date: { type: Date, default: Date.now }
});
var userSchema = new mongoose.Schema({
    username: String,
    port_id: String,
    company_id: String,
    email_id: String,
    password: String,
    credit: Number,
    total_outstanding: Number,
    invoices: [invoiceSchema],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("users", userSchema);