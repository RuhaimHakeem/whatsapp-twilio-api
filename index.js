const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const questions = require("./questions.js");

const ngrok = require("ngrok");
const accountSid = "AC3d32fdb994c1e000eed0fa12e2698aa3";
const authToken = "7a5e063a9138568c084d9bbb2df5138f";
const client = require("twilio")(accountSid, authToken);
const { db } = require("./firebase.js");

const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let ordersReviewOnProcess = [];

app.post("/webhook", (req, res) => {
  const mobileNo = req.body.WaId;

  const orderIndex = ordersReviewOnProcess.findIndex(
    (order) => order.mobileNo == mobileNo
  );

  const order = ordersReviewOnProcess[orderIndex];

  console.log(order.questionSent);

  if (order.questionSent === 3) {
    return;
  }

  const to = `whatsapp:+${order.mobileNo}`;

  if (order.questionSent === 1) {
    client.messages.create({
      body: questions[1],
      from: "whatsapp:+14155238886",
      to: to,
    });

    order.questionSent = 2;
  } else if (order.questionSent === 2) {
    client.messages.create({
      body: questions[2],
      from: "whatsapp:+14155238886",
      to: to,
    });
    order.questionSent = 3;
  }
});

const addOrder = async (req, res) => {
  const { mobileNo, products, description, price, orderId } = req.body;

  if (!mobileNo || !products || !description || !price) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }

  const to = `whatsapp:+${mobileNo}`;
  client.messages.create({
    body: questions[0],
    from: "whatsapp:+14155238886",
    to: to,
  });

  ordersReviewOnProcess.push({ orderId, mobileNo, questionSent: 1 });

  try {
    const ordersRef = db.collection("orders");
    const data = await ordersRef.add({
      orderId,
      products,
      description,
      buyerName: "Ruhaim",
      price,
      isReviewed: false,
      mobileNo,
    });
    res.status(200).json({ message: "Order added successfully" });
  } catch (e) {
    res.status(400);
    console.log(e);
  }
};

app.post("/add", addOrder);

app.get("/getOrders", async (req, res) => {});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// const ordersRef = db.collection("orders");
// const querySnapshot = await ordersRef
//   .where("orderId", "==", "123")
//   .where("mobileNo", "==", "94767860850")
//   .get();

// const orders = [];
// querySnapshot.forEach((doc) => {
//   orders.push(doc.data());
// });
