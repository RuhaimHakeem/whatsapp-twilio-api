const questions = [
  {
    question:
      "your recent order has been delivered. We'd really appreciate if you could take a quick survey and share your feedback. Just reply 'Y' to get started or 'N' to skip. Your honest thoughts help us improve. Thanks for choosing us!",
    isRangeQuestion: false,
  },
  {
    question:
      "On a scale of 1 to 5, how would you rate your overall experience with our product and service? (1 - Not satisfied at all, 5 - Extremely satisfied)",
    isRangeQuestion: true,
  },
  {
    question:
      "Based on your recent experience with us, how likely are you to choose our bakery for your next product order? Please rate on a scale of 1 to 5. (1 - Very unlikely, 5 - Definitely will choose us again",
    isRangeQuestion: true,
  },
  {
    question:
      "Could you please share a detailed description of your experience with the product you ordered from us. What did you like or dislike about the taste, texture, presentation, and overall quality?",
    isRangeQuestion: false,
  },
  {
    question:
      "For your next order, would you like to see any improvements in areas like product quality, packaging, or delivery speed?",
    isRangeQuestion: false,
  },
];

module.exports = questions;
