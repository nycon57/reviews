const test = require("node:test");
const assert = require("node:assert/strict");
const nock = require("nock");
const zapier = require("zapier-platform-core");
const App = require("../index");
const sampleSnapshot = require("../utils/sample-snapshot.json");

const appTester = zapier.createAppTester(App);
const BASE_URL = "https://repwell.test";
const authData = { api_key: "rw_test_123" };

test.beforeEach(() => {
  process.env.BASE_URL = BASE_URL;
});

test.afterEach(() => {
  nock.cleanAll();
});

test("auth test sends the API key and returns organization data", async () => {
  nock(BASE_URL, {
    reqheaders: {
      "x-api-key": authData.api_key,
    },
  })
    .get("/api/v1/organization")
    .reply(200, {
      success: true,
      data: {
        id: "org_123",
        name: "Acme Mortgage",
      },
    });

  const response = await appTester(App.authentication.test, { authData });

  assert.equal(response.data.data.name, "Acme Mortgage");
  assert.equal(nock.isDone(), true);
});

test("new review trigger subscribes to review.published and parses hook payloads", async () => {
  nock(BASE_URL, {
    reqheaders: {
      "x-api-key": authData.api_key,
    },
  })
    .post("/api/v1/webhooks/subscriptions", (body) => {
      assert.equal(body.target_url, "https://hooks.zapier.com/hooks/catch/123");
      assert.deepEqual(body.events, ["review.published"]);
      return true;
    })
    .reply(201, {
      id: "sub_123",
      target_url: "https://hooks.zapier.com/hooks/catch/123",
      events: ["review.published"],
      secret: "whsec_123",
      created_at: "2026-07-08T12:00:00.000Z",
    });

  const subscribeData = await appTester(App.triggers.new_review.operation.performSubscribe, {
    authData,
    targetUrl: "https://hooks.zapier.com/hooks/catch/123",
  });

  assert.equal(subscribeData.id, "sub_123");

  const payload = {
    id: "evt_123",
    type: "review.published",
    created_at: "2026-07-08T12:00:00.000Z",
    organization_id: "org_123",
    data: { review_id: "rev_123", rating: 5 },
  };

  const parsed = await appTester(App.triggers.new_review.operation.perform, {
    cleanedRequest: payload,
  });

  assert.deepEqual(parsed, [payload]);
  assert.equal(nock.isDone(), true);
});

test("trigger samples match the checked-in outbound webhook snapshot", () => {
  const triggerEvents = {
    new_review: "review.published",
    negative_review: "review.negative",
    review_response: "review.responded",
    survey_completed: "survey.completed",
    new_contact: "contact.created",
  };

  for (const [triggerKey, eventType] of Object.entries(triggerEvents)) {
    const triggerSample = App.triggers[triggerKey].operation.sample;
    const snapshotSample = sampleSnapshot[eventType];

    assert.deepEqual(triggerSample, snapshotSample);
    assert.deepEqual(
      Object.keys(triggerSample.data).sort(),
      Object.keys(snapshotSample.data).sort()
    );
  }
});

test("create contact action posts contact fields", async () => {
  nock(BASE_URL, {
    reqheaders: {
      "x-api-key": authData.api_key,
    },
  })
    .post("/api/v1/contacts", {
      full_name: "Avery Stone",
      email: "avery@example.com",
      external_id: "crm_123",
    })
    .reply(201, {
      success: true,
      data: {
        id: "contact_123",
        full_name: "Avery Stone",
        email: "avery@example.com",
        external_id: "crm_123",
      },
    });

  const result = await appTester(App.creates.create_contact.operation.perform, {
    authData,
    inputData: {
      full_name: "Avery Stone",
      email: "avery@example.com",
      external_id: "crm_123",
    },
  });

  assert.equal(result.id, "contact_123");
  assert.equal(result.email, "avery@example.com");
  assert.equal(nock.isDone(), true);
});
