const sendMessage = async (client, to, message) => {
  try {
    await client.messages.create({
      body: message,
      from: "whatsapp:+14155238886",
      to: to,
    });
  } catch (e) {
    throw e;
  }
};

module.exports = { sendMessage };
