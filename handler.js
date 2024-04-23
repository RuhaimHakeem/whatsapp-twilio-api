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
  const { product, mobile, description, quantity, totalPrice } = req.body;

  if (!mobile || !product || !description || !quantity || !totalPrice) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }

  const orderId = generateFirestoreDocId();

  const confirmationMessage = `Dear Ruhaim, Thank you for your recent order. We are delighted to confirm that your order has been successfully received and is now being processed. Below are the details of your order: \n\nOrder Number: ${orderId}\n Item Ordered: ${product} - ${quantity}\n Total Amount: ${totalPrice}`;

  const to = `whatsapp:+${mobile}`;

  await sendMessage(client, to, confirmationMessage);

  try {
    await db
      .collection("orders")
      .doc(orderId)
      .set({
        orderId,
        status: "Pending",
        ...req.body,
      });

    res.status(200).json({ message: "Order added successfully" });
  } catch (e) {
    res.status(400);
    console.log(e);
  }
};

const updateStatus = async (req, res) => {
  const { orderId, mobile } = req.body;

  const to = `whatsapp:+${mobile}`;

  try {
    await db.collection("orders").doc(orderId).update({
      status: "Delivered",
    });
    try {
      await sendMessage(client, to, questions[0].question);
      ordersReviewOnProcess.push({ orderId, mobile, questionSent: 1 });
    } catch (e) {
      res.status(500).json({ message: "Unable to send message" });
      return;
    }

    res.status(200).json({ message: "Order updated successfully" });
  } catch (e) {
    res.status(500).json({ message: "Something went wrong" });
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

  if (order.questionSent === 5) {
    await sendMessage(client, to, "Thanks for answering the questions");

    const answer = await getAnswers(order.orderId);

    if (!answer) {
      return;
    }
    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", {
        text: answer,
      });

      db.collection("reviews").add({
        orderId: order.orderId,
        sentiment: response.data.sentiment,
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

const predict = async (req, res) => {
  const answersRef = db.collection("answers");

  const querySnapshot = await answersRef
    .where("orderId", "==", "1713072209460cm3nqu5u")
    .select("answers")
    .get();

  let answer = "";

  if (!querySnapshot.empty) {
    querySnapshot.forEach(async (doc) => {
      try {
        const text = doc
          .data()
          .answers.filter((answer) => answer.isRangeAnswer)
          .map((answer) => {
            const text =
              answer.a == 5
                ? "Great"
                : answer.a == 4
                ? "Good"
                : answer.a == 3
                ? "Okay"
                : answer.a == 2
                ? "Bad"
                : answer.a == 1
                ? "Bad"
                : undefined;

            return text;
          });

        answer += `${text} `;

        answer += doc
          .data()
          .answers.filter((answer) => !answer.isRangeAnswer)
          .map((answer) => answer.a)
          .join(", ");

        console.log(answer);
      } catch (error) {
        console.error("Error updating document:", error);
      }
    });
  }
};

module.exports = { addOrder, webhookHandler, predict, updateStatus };
