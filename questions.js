const questions = [
  {
    question:
      "Hi Ruhaim, thanks for your recent order! your order has beed delivered to your location. Would you mind taking a moment to share your feedback?\nType 'Y' for YES and 'N' for NO",
    isRangeQuestion: false,
  },
  {
    question:
      "On a scale of 1 to 5, how would you rate the overall quality of the Cake you purchased from us?",
    isRangeQuestion: true,
  },
  {
    question:
      "How satisfied were you with the taste of the Cake? (1 - Not satisfied, 5 - Very satisfied)",
    isRangeQuestion: true,
  },
  {
    question:
      "How would you describe your experience with the Cake in a few words?",
    isRangeQuestion: false,
  },
  {
    question:
      "Could you please share a few lines about your overall experience with our bakery and the product?",
    isRangeQuestion: false,
  },
];

module.exports = questions;
