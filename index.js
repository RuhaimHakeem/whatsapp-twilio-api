require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

const { addOrder, webhookHandler, updateStatus } = require("./handler.js");

const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/webhook", webhookHandler);

app.post("/add", addOrder);

app.post("/updateStatus", updateStatus);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
