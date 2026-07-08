const { createRestHookTrigger } = require("../utils/triggers");

module.exports = createRestHookTrigger({
  key: "survey_completed",
  noun: "Survey",
  label: "Survey Completed",
  description: "Triggers when a customer completes a RepWell survey.",
  eventType: "survey.completed",
});
