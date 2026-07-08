const { createRestHookTrigger } = require("../utils/triggers");

module.exports = createRestHookTrigger({
  key: "new_review",
  noun: "Review",
  label: "New Review",
  description: "Triggers when a review is published in RepWell.",
  eventType: "review.published",
});
