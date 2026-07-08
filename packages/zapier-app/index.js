const zapier = require("zapier-platform-core");
const packageJson = require("./package.json");
const authentication = require("./authentication");
const { includeApiKey, handleHttpError } = require("./utils/http");

const newReview = require("./triggers/new_review");
const negativeReview = require("./triggers/negative_review");
const reviewResponse = require("./triggers/review_response");
const surveyCompleted = require("./triggers/survey_completed");
const newContact = require("./triggers/new_contact");

const createContact = require("./creates/create_contact");
const triggerSurvey = require("./creates/trigger_survey");

module.exports = {
  version: packageJson.version,
  platformVersion: zapier.version,
  authentication,
  flags: {
    cleanInputData: false,
  },
  beforeRequest: [includeApiKey],
  afterResponse: [handleHttpError],
  triggers: {
    [newReview.key]: newReview,
    [negativeReview.key]: negativeReview,
    [reviewResponse.key]: reviewResponse,
    [surveyCompleted.key]: surveyCompleted,
    [newContact.key]: newContact,
  },
  creates: {
    [createContact.key]: createContact,
    [triggerSurvey.key]: triggerSurvey,
  },
};
