const { createRestHookTrigger } = require("../utils/triggers");

module.exports = createRestHookTrigger({
  key: "new_contact",
  noun: "Contact",
  label: "New Contact",
  description: "Triggers when a contact is created in RepWell.",
  eventType: "contact.created",
});
