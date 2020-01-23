var mongoose = require("mongoose");
var invoiceSchema = new mongoose.Schema({
    invoice_amount: Number,
    actual_amount: Number,
    paid: Boolean,
    description: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("invoices", invoiceSchema);