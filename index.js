require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const { addOrder, webhookHandler } = require("./handler.js");

const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/webhook", webhookHandler);

app.post("/add", addOrder);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
