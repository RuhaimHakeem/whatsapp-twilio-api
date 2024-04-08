const sendMessage = (client, to, message) => {
  client.messages.create({
    body: message,
    from: "whatsapp:+14155238886",
    to: to,
  });
};

module.exports = { sendMessage };
