const generateFirestoreDocId = () => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}${randomString}`;
};

module.exports = { generateFirestoreDocId };
