const questions = require("../questions.js");
const { db } = require("../firebase.js");

const addAnswer = async (orderId, message, isRangeQuestion) => {
  const answersRef = db.collection("answers");

  const querySnapshot = await answersRef
    .where("orderId", "==", orderId)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    querySnapshot.forEach(async (doc) => {
      try {
        const existingAnswers = doc.data().answers || [];
        const existingAnswersLength = existingAnswers.length;
        const updatedAnswers = [
          ...existingAnswers,
          {
            q: questions[existingAnswersLength + 1].question,
            a: message,
            isRangeAnswer: isRangeQuestion,
          },
        ];
        await doc.ref.update({ answers: updatedAnswers });
      } catch (error) {
        console.error("Error updating document:", error);
      }
    });
  } else {
    try {
      await answersRef.add({
        orderId: orderId,
        answers: [
          {
            q: questions[1].question,
            a: message,
            isRangeAnswer: isRangeQuestion,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding document:", error);
    }
  }
};

module.exports = { addAnswer };
