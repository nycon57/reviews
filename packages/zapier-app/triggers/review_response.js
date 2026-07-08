const { createRestHookTrigger } = require("../utils/triggers");

module.exports = createRestHookTrigger({
  key: "review_response",
  noun: "Review Response",
  label: "Review Response",
  description: "Triggers when a review receives a response in RepWell.",
  eventType: "review.responded",
});
