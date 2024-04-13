const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const { db } = require("./firebase.js");
const { generateFirestoreDocId } = require("./utils/generate-doc-id.js");
const { sendMessage } = require("./utils/send-message.js");
const { addAnswer } = require("./utils/add-answer.js");
const questions = require("./questions.js");

// Handler for adding orders

let ordersReviewOnProcess = [];

const addOrder = async (req, res) => {
  const { product, mobile, description, quantity } = req.body;

  if (!mobile || !product || !description || !quantity) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }

  const orderId = generateFirestoreDocId();

  const to = `whatsapp:+${mobile}`;
  sendMessage(client, to, questions[0].question);

  ordersReviewOnProcess.push({ orderId, mobile, questionSent: 1 });

  try {
    db.collection("orders").doc(orderId).set(req.body);

    res.status(200).json({ message: "Order added successfully" });
  } catch (e) {
    res.status(400);
    console.log(e);
  }
};

// Handler for webhook
const webhookHandler = async (req, res) => {
  if (!ordersReviewOnProcess.length) {
    return;
  }

  const mobileNo = req.body.WaId;

  const orderIndex = ordersReviewOnProcess.findIndex(
    (order) => order.mobileNo == mobileNo
  );

  if (orderIndex < 0) {
    return;
  }

  const order = ordersReviewOnProcess[orderIndex];

  if (
    order.questionSent === 1 &&
    (req.body.Body === "n" || req.body.Body === "N")
  ) {
    ordersReviewOnProcess.splice(orderIndex, 1);
    return;
  }

  const to = `whatsapp:+${order.mobileNo}`;

  if (order.questionSent !== 1) {
    addAnswer(
      order.orderId,
      req.body.Body,
      questions[order.questionSent - 1].isRangeQuestion
    );
  }

  if (order.questionSent === 5) {
    sendMessage(client, to, "Thanks for answering the questions");

    ordersReviewOnProcess.splice(orderIndex, 1);
    return;
  }

  if (order.questionSent >= 0 && order.questionSent < questions.length) {
    sendMessage(client, to, questions[order.questionSent].question);
    order.questionSent++;
  } else {
    return;
  }
};

module.exports = { addOrder, webhookHandler };
