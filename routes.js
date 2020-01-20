const checksum_lib = require("./paytm/checksum/checksum");
const port = process.env.PORT;
module.exports = (app) => {
    app.get("/payment", (req, res) => {
        let params = {};
        params["MID"] = "",              //merchant id
            params["WEBSITE"] = "WEBSTAGING",
            params["CHANNEL_ID"] = "WEB",
            params["INDUSTRY_TYPE_ID"] = "Retail",
            params["ORDER_ID"] = "ORD0001",
            params["CUST_ID"] = "cus001",
            params["TXN_AMOUNT"] = "100",
            params["CALLBACK_URL"] = 'http://localhost:' + port + '/callback',
            params["EMAIL"] = "dfghf@gmail.com",
            params["MOBILE_NO"] = "5837537123"

        checksum_lib.genchecksum(params, "", function(err, checksum) {       //merchant key
            let url = "https://securegw-stage.paytm.in/order/process";
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<html>');
            res.write('<head>');
            res.write('<title>Merchant Checkout Page</title>');
            res.write('</head>');
            res.write('<body>');
            res.write('<center><h1>Please do not refresh this page...</h1></center>');
            res.write('<form method="post" action="' + url + '" name="paytm_form">');
            for (var x in params) {
                res.write('<input type="hidden" name="' + x + '" value="' + params[x] + '">');
            }
            res.write('<input type="hidden" name="CHECKSUMHASH" value="' + checksum + '">');
            res.write('</form>');
            res.write('<script type="text/javascript">');
            res.write('document.paytm_form.submit()');
            res.write('</script>');
            res.write('</body>');
            res.write('</html>');
            res.end();

        })

    })
}
