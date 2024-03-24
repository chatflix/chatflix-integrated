import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import path from "path";

//allow cors from anywhere using node.js express cors
import cors from "cors";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8888, MEMBERSHIP_API_URL, CHATFLIX_BASE_URL } = process.env;
//real men don't use sandbox const base = "https://api-m.sandbox.paypal.com";
const base = "https://api-m.paypal.com"
const app = express();
app.use(cors());
app.set('view engine', 'ejs');

// host static files
app.use(express.static("client"));

// parse post params sent in body in json format
app.use(express.json());

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
    ).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (cart, productId) => {
  // use the cart information passed from the front-end to calculate the purchase unit details
  console.log(
    "shopping cart information passed from the frontend createOrder() callback:",
    cart,
  );

  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const ref =  `membership_${Date.now()}_${productId}_${JSON.parse(cart[0]).actual_price}`
  console.log("Reference No. for order:", ref);
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: JSON.parse(cart[0]).actual_price,
        },
        reference_id:ref,
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });

  return handleResponse(response);
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

app.post("/api/orders", async (req, res) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { cart, productID } = req.body;
    const { jsonResponse, httpStatusCode } = await createOrder(cart, productID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  } 
});
app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    console.log("Capturing order:", orderID);

    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    console.log(JSON.stringify(jsonResponse, null, 2))
      console.log("Order Success! Reference No.:", jsonResponse.purchase_units[0].reference_id);
      const productID= jsonResponse.purchase_units[0].reference_id.split('_')[2]
      const paymentAmountUSD = jsonResponse.purchase_units[0].reference_id.split('_')[3]
      //const products = await fetch(`${process.env.MEMBERSHIP_API_URL}/products`);
      //const orderedProduct = products.json().find(product => product.id == productID);
      if (!productID) {
        console.log("Oops, customer needs a refund. Product not found.");
        return
      }
      // const membershipApplication = JSON.stringify({
      //   product_id: parseInt(productID),
      //   payment_id: jsonResponse.id,
      //   payment_provider: "paypal",
      //   is_crypto: 0,
      //   payment_amount: parseFloat(paymentAmountUSD)
      // }, null, 2)

      // console.log("Membership Payload: ", membershipApplication)
      console.log("Creating membership: ", `${process.env.MEMBERSHIP_API_URL}/create-paid-membership?product_id=${productID}&payment_id=${jsonResponse.id}&payment_provider=paypal&is_crypto=0&payment_amount=${paymentAmountUSD}`)
      const membership = await fetch(`${process.env.MEMBERSHIP_API_URL}/create-paid-membership?product_id=${productID}&payment_id=${jsonResponse.id}&payment_provider=paypal&is_crypto=0&payment_amount=${paymentAmountUSD}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      })

    jsonResponse.chatflix_membership = await membership.json()
    console.log(jsonResponse.chatflix_membership)
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Capture order failed:", error);
    res.status(500).json({ error: "Failed to capture order. Payment was not collected" });
  }
});

//checkout flow - step 1: pick a product, click buy now. there is no cart, no login, no recurring billing
//process.env.MEMBERSHIP_API_URL will always point to [production chatflix url]/api/membership
app.get("/paywall", (req, res) => {
  res.render("activation-required.ejs", {
    CHATFLIX_BASE_URL: process.env.CHATFLIX_BASE_URL,
    IS_MEMBER: false

  })
  //res.sendFile(path.resolve("client/products.html"));
});

app.get("/packages", (req, res) => {
  //determine the referrer from the request header
  const referrer = req.get("Referrer");
  if (referrer && referrer.includes("interstitial") || req.query["chatflix"]=="1")  {
    res.render("packages-chatflix.ejs", {
      CHATFLIX_BASE_URL: process.env.CHATFLIX_BASE_URL,
      IS_MEMBER: false
      
    })  
  } else {
    res.render("packages.ejs", {
      CHATFLIX_BASE_URL: process.env.CHATFLIX_BASE_URL,
      IS_MEMBER: false
      
    })
  }
  //res.sendFile(path.resolve("client/products.html"));
});

app.get('/checkout', (req, res) => {
  res.render("checkout.ejs", {
    CHATFLIX_BASE_URL: process.env.CHATFLIX_BASE_URL
  })
  //res.sendFile(path.resolve("client/checkout.html"));
})


app.get('/', (req, res) => {
  res.render("flix-home.ejs", {
    CHATFLIX_BASE_URL: process.env.CHATFLIX_BASE_URL
  })
  //res.sendFile(path.resolve("client/checkout.html"));
})

//checkout flow - step 2: checkout page confirming product details, and with paypal payment buttons


app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});
