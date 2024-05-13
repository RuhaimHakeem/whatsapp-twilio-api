const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const { db } = require("./firebase.js");
const { generateFirestoreDocId } = require("./utils/generate-doc-id.js");
const { sendMessage } = require("./utils/send-message.js");
const { addAnswer } = require("./utils/add-answer.js");
const { getAnswers } = require("./utils/get-answers.js");
const questions = require("./questions.js");
const axios = require("axios");

// Handler for adding orders

let ordersReviewOnProcess = [];

const addOrder = async (req, res) => {
  const { customerName, product, mobile, description, quantity, totalPrice } =
    req.body;

  if (
    !mobile ||
    !product ||
    !description ||
    !quantity ||
    !totalPrice ||
    !customerName
  ) {
    res.status(400).json({ message: "Please provide all the fields" });
    return;
  }

  const orderId = generateFirestoreDocId();

  const confirmationMessage = `Dear ${customerName}, Thank you for your recent order. We are delighted to confirm that your order has been successfully received and is now being processed. Below are the details of your order: \n\n Item Ordered: ${product} - ${quantity}\n Total Amount: ${totalPrice}`;

  const to = `whatsapp:+${mobile}`;

  try {
    await db
      .collection("orders")
      .doc(orderId)
      .set({
        orderId,
        status: "Pending",
        ...req.body,
      });
    try {
      await sendMessage(client, to, confirmationMessage);
    } catch (e) {
      res.status(500).json({
        message:
          "Order has been added successfully but unable to send confirmation message",
      });
    }

    res.status(200).json({
      message:
        "Order has been added successfully and the confirmation message is sent",
    });
  } catch (e) {
    res.status(400);
    console.log(e);
  }
};

const updateStatus = async (req, res) => {
  const { orderId, mobile, customerName } = req.body;

  if (!orderId || !mobile) {
    res.status(400).json({ message: "Please provide all the fields" });
    return;
  }

  const to = `whatsapp:+${mobile}`;

  try {
    await db.collection("orders").doc(orderId).update({
      status: "Delivered",
    });
    try {
      await sendMessage(
        client,
        to,
        `Hi ${customerName}, ${questions[0].question}`
      );
      ordersReviewOnProcess.push({ orderId, mobile, questionSent: 1 });
    } catch (e) {
      res.status(500).json({
        message:
          "Order status has been updated successfully but unable to send feedback question",
      });
      return;
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (e) {
    res.status(500).json({
      message:
        "Unable to update order status. Please verify the details and try again.",
    });
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
    (order) => order.mobile == mobileNo
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

  const to = `whatsapp:+${order.mobile}`;

  if (order.questionSent !== 1) {
    await addAnswer(
      order.orderId,
      req.body.Body,
      questions[order.questionSent - 1].isRangeQuestion
    );
  }

  if (order.questionSent === questions.length) {
    await sendMessage(
      client,
      to,
      "Thank you for taking the time to answer our questions and share your valuable feedback.We appreciate your support and look forward to serving you again soon!"
    );

    const answer = await getAnswers(order.orderId);

    if (!answer) {
      return;
    }
    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", {
        text: answer,
      });

      await db.collection("orders").doc(order.orderId).update({
        sentiment: response.data.sentiment,
        isReviewed: true,
      });

      res.status(200).send({ sentiment: response.data });
    } catch (error) {
      console.error("Error sending data:", error);
      res.status(500).send("Error sending data");
    }

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

module.exports = { addOrder, webhookHandler, updateStatus };
