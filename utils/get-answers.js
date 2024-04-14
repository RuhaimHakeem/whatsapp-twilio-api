const { db } = require("../firebase.js");

const getAnswers = async (orderId) => {
  const answersRef = db.collection("answers");

  const querySnapshot = await answersRef
    .where("orderId", "==", orderId)
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
      } catch (error) {
        console.error("Error updating document:", error);
      }
    });
  }
  return answer;
};

module.exports = { getAnswers };
