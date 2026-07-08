const { createRestHookTrigger } = require("../utils/triggers");

module.exports = createRestHookTrigger({
  key: "negative_review",
  noun: "Review",
  label: "Negative Review",
  description: "Triggers when RepWell publishes or detects a negative review.",
  eventType: "review.negative",
});
