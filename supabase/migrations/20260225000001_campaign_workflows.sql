-- Campaign workflow builder (PR 1)
-- Adds org-scoped campaign workflows + system workflow templates.

CREATE TABLE IF NOT EXISTS campaign_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  sequence_definition JSONB NOT NULL DEFAULT '{}',
  canvas_metadata JSONB NOT NULL DEFAULT '{}',
  trigger_type TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_workflows_org
  ON campaign_workflows(organization_id);

CREATE INDEX IF NOT EXISTS idx_campaign_workflows_status
  ON campaign_workflows(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_campaign_workflows_lock
  ON campaign_workflows(organization_id, locked_at)
  WHERE locked_by IS NOT NULL;

ALTER TABLE campaign_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_campaign_workflows" ON campaign_workflows;
CREATE POLICY "org_members_read_campaign_workflows"
  ON campaign_workflows FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "managers_write_campaign_workflows" ON campaign_workflows;
CREATE POLICY "managers_write_campaign_workflows"
  ON campaign_workflows FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

DROP POLICY IF EXISTS "service_role_manage_campaign_workflows" ON campaign_workflows;
CREATE POLICY "service_role_manage_campaign_workflows"
  ON campaign_workflows FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_campaign_workflows_updated_at ON campaign_workflows;
CREATE TRIGGER update_campaign_workflows_updated_at
  BEFORE UPDATE ON campaign_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('review_collection', 'onboarding', 'retention', 'win_back', 'testimonial', 'payment')),
  icon_name TEXT NOT NULL DEFAULT 'Envelope',
  sequence_definition JSONB NOT NULL,
  canvas_metadata JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  popularity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_templates_name_unique
  ON workflow_templates(name);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category
  ON workflow_templates(category);

REVOKE ALL ON TABLE workflow_templates FROM anon;
REVOKE ALL ON TABLE workflow_templates FROM authenticated;
GRANT SELECT ON TABLE workflow_templates TO authenticated;
GRANT ALL ON TABLE workflow_templates TO service_role;

INSERT INTO workflow_templates (
  name,
  description,
  category,
  icon_name,
  sequence_definition,
  canvas_metadata,
  is_system,
  popularity
)
VALUES
  (
    'Review Request',
    'loan_closed -> wait 3d -> email -> wait 5d -> if no review -> SMS -> wait 7d -> final email',
    'review_collection',
    'Envelope',
    '{
      "type": "custom",
      "name": "Review Request",
      "description": "Collect a review after loan close with reminders.",
      "triggers": [{ "type": "event", "event": "custom_event", "customEvent": "loan_closed" }],
      "steps": [
        {
          "step": 1,
          "template": { "name": "survey_invitation" },
          "delay": { "value": 3, "unit": "days" },
          "description": "Initial review request email"
        },
        {
          "step": 2,
          "template": { "name": "survey_reminder_3day" },
          "delay": { "value": 5, "unit": "days" },
          "channelConfig": {
            "channel": "sms",
            "smsTemplate": { "templateId": "review_request_sms_reminder" },
            "fallbackChannel": "email"
          },
          "description": "SMS reminder when no review is captured"
        },
        {
          "step": 3,
          "template": { "name": "survey_reminder_7day" },
          "delay": { "value": 7, "unit": "days" },
          "description": "Final review request email"
        }
      ]
    }'::jsonb,
    '{
      "nodes": [
        { "id": "trigger", "type": "trigger-event", "position": { "x": 240, "y": 40 }, "data": { "event": "loan_closed" } },
        { "id": "wait_1", "type": "delay-wait", "position": { "x": 240, "y": 180 }, "data": { "value": 3, "unit": "days" } },
        { "id": "email_1", "type": "action-email", "position": { "x": 240, "y": 320 }, "data": { "template": "survey_invitation" } },
        { "id": "wait_2", "type": "delay-wait", "position": { "x": 240, "y": 460 }, "data": { "value": 5, "unit": "days" } },
        { "id": "sms_1", "type": "action-sms", "position": { "x": 240, "y": 600 }, "data": { "template": "review_request_sms_reminder" } },
        { "id": "wait_3", "type": "delay-wait", "position": { "x": 240, "y": 740 }, "data": { "value": 7, "unit": "days" } },
        { "id": "email_2", "type": "action-email", "position": { "x": 240, "y": 880 }, "data": { "template": "survey_reminder_7day" } },
        { "id": "exit", "type": "control-exit", "position": { "x": 240, "y": 1020 }, "data": { "reason": "action_completed" } }
      ],
      "edges": [
        { "id": "e1", "source": "trigger", "target": "wait_1" },
        { "id": "e2", "source": "wait_1", "target": "email_1" },
        { "id": "e3", "source": "email_1", "target": "wait_2" },
        { "id": "e4", "source": "wait_2", "target": "sms_1" },
        { "id": "e5", "source": "sms_1", "target": "wait_3" },
        { "id": "e6", "source": "wait_3", "target": "email_2" },
        { "id": "e7", "source": "email_2", "target": "exit" }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }'::jsonb,
    TRUE,
    92
  ),
  (
    'Welcome Onboarding',
    'user_signup -> email -> wait 1d -> if profile incomplete -> reminder -> wait 3d -> feature tour',
    'onboarding',
    'RocketLaunch',
    '{
      "type": "welcome",
      "name": "Welcome Onboarding",
      "description": "Guide new users through first value moments.",
      "triggers": [{ "type": "event", "event": "user_signup" }],
      "steps": [
        {
          "step": 1,
          "template": { "name": "welcome_1_access" },
          "delay": { "value": 0, "unit": "hours" },
          "description": "Welcome email"
        },
        {
          "step": 2,
          "template": { "name": "welcome_2_profile" },
          "delay": { "value": 1, "unit": "days" },
          "description": "Profile completion reminder"
        },
        {
          "step": 3,
          "template": { "name": "welcome_3_first_action" },
          "delay": { "value": 3, "unit": "days" },
          "description": "Feature tour and first-action nudge"
        }
      ]
    }'::jsonb,
    '{
      "nodes": [
        { "id": "trigger", "type": "trigger-event", "position": { "x": 220, "y": 40 }, "data": { "event": "user_signup" } },
        { "id": "email_1", "type": "action-email", "position": { "x": 220, "y": 180 }, "data": { "template": "welcome_1_access" } },
        { "id": "wait_1", "type": "delay-wait", "position": { "x": 220, "y": 320 }, "data": { "value": 1, "unit": "days" } },
        { "id": "email_2", "type": "action-email", "position": { "x": 220, "y": 460 }, "data": { "template": "welcome_2_profile" } },
        { "id": "wait_2", "type": "delay-wait", "position": { "x": 220, "y": 600 }, "data": { "value": 3, "unit": "days" } },
        { "id": "email_3", "type": "action-email", "position": { "x": 220, "y": 740 }, "data": { "template": "welcome_3_first_action" } },
        { "id": "exit", "type": "control-exit", "position": { "x": 220, "y": 880 }, "data": { "reason": "activation_milestone_reached" } }
      ],
      "edges": [
        { "id": "e1", "source": "trigger", "target": "email_1" },
        { "id": "e2", "source": "email_1", "target": "wait_1" },
        { "id": "e3", "source": "wait_1", "target": "email_2" },
        { "id": "e4", "source": "email_2", "target": "wait_2" },
        { "id": "e5", "source": "wait_2", "target": "email_3" },
        { "id": "e6", "source": "email_3", "target": "exit" }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }'::jsonb,
    TRUE,
    88
  ),
  (
    'Re-engagement',
    'user_inactive 30d -> email -> wait 7d -> if no login -> SMS -> wait 14d -> exit',
    'retention',
    'ArrowCounterClockwise',
    '{
      "type": "re-engagement",
      "name": "Re-engagement",
      "description": "Win back inactive users with timed nudges.",
      "triggers": [
        {
          "type": "event",
          "event": "user_inactive",
          "conditions": [{ "field": "metadata.days_inactive", "operator": "greater_than_or_equals", "value": 30 }]
        }
      ],
      "steps": [
        {
          "step": 1,
          "template": { "name": "reengagement_1_miss_you" },
          "delay": { "value": 0, "unit": "hours" },
          "description": "Initial comeback email"
        },
        {
          "step": 2,
          "template": { "name": "reengagement_2_whats_new" },
          "delay": { "value": 7, "unit": "days" },
          "channelConfig": {
            "channel": "sms",
            "smsTemplate": { "templateId": "reengagement_sms_checkin" },
            "fallbackChannel": "email"
          },
          "description": "SMS check-in when no login"
        },
        {
          "step": 3,
          "template": { "name": "reengagement_4_final" },
          "delay": { "value": 14, "unit": "days" },
          "description": "Final re-engagement attempt"
        }
      ]
    }'::jsonb,
    '{
      "nodes": [
        { "id": "trigger", "type": "trigger-event", "position": { "x": 260, "y": 40 }, "data": { "event": "user_inactive", "days": 30 } },
        { "id": "email_1", "type": "action-email", "position": { "x": 260, "y": 180 }, "data": { "template": "reengagement_1_miss_you" } },
        { "id": "wait_1", "type": "delay-wait", "position": { "x": 260, "y": 320 }, "data": { "value": 7, "unit": "days" } },
        { "id": "sms_1", "type": "action-sms", "position": { "x": 260, "y": 460 }, "data": { "template": "reengagement_sms_checkin" } },
        { "id": "wait_2", "type": "delay-wait", "position": { "x": 260, "y": 600 }, "data": { "value": 14, "unit": "days" } },
        { "id": "email_2", "type": "action-email", "position": { "x": 260, "y": 740 }, "data": { "template": "reengagement_4_final" } },
        { "id": "exit", "type": "control-exit", "position": { "x": 260, "y": 880 }, "data": { "reason": "timeout" } }
      ],
      "edges": [
        { "id": "e1", "source": "trigger", "target": "email_1" },
        { "id": "e2", "source": "email_1", "target": "wait_1" },
        { "id": "e3", "source": "wait_1", "target": "sms_1" },
        { "id": "e4", "source": "sms_1", "target": "wait_2" },
        { "id": "e5", "source": "wait_2", "target": "email_2" },
        { "id": "e6", "source": "email_2", "target": "exit" }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }'::jsonb,
    TRUE,
    84
  ),
  (
    'Video Testimonial',
    'review_received 5-star -> wait 1d -> email request -> wait 3d -> reminder -> wait 7d -> final',
    'testimonial',
    'VideoCamera',
    '{
      "type": "custom",
      "name": "Video Testimonial",
      "description": "Request video testimonials after strong written feedback.",
      "triggers": [
        {
          "type": "event",
          "event": "review_received",
          "conditions": [{ "field": "metadata.rating", "operator": "greater_than_or_equals", "value": 5 }]
        }
      ],
      "steps": [
        {
          "step": 1,
          "template": { "name": "video_testimonial_invitation" },
          "delay": { "value": 1, "unit": "days" },
          "description": "Invite happy customers to record a video"
        },
        {
          "step": 2,
          "template": { "name": "video_testimonial_reminder_3day" },
          "delay": { "value": 3, "unit": "days" },
          "description": "First reminder"
        },
        {
          "step": 3,
          "template": { "name": "video_testimonial_reminder_7day" },
          "delay": { "value": 7, "unit": "days" },
          "description": "Final reminder"
        }
      ]
    }'::jsonb,
    '{
      "nodes": [
        { "id": "trigger", "type": "trigger-event", "position": { "x": 240, "y": 40 }, "data": { "event": "review_received", "rating": 5 } },
        { "id": "wait_1", "type": "delay-wait", "position": { "x": 240, "y": 180 }, "data": { "value": 1, "unit": "days" } },
        { "id": "email_1", "type": "action-email", "position": { "x": 240, "y": 320 }, "data": { "template": "video_testimonial_invitation" } },
        { "id": "wait_2", "type": "delay-wait", "position": { "x": 240, "y": 460 }, "data": { "value": 3, "unit": "days" } },
        { "id": "email_2", "type": "action-email", "position": { "x": 240, "y": 600 }, "data": { "template": "video_testimonial_reminder_3day" } },
        { "id": "wait_3", "type": "delay-wait", "position": { "x": 240, "y": 740 }, "data": { "value": 7, "unit": "days" } },
        { "id": "email_3", "type": "action-email", "position": { "x": 240, "y": 880 }, "data": { "template": "video_testimonial_reminder_7day" } },
        { "id": "exit", "type": "control-exit", "position": { "x": 240, "y": 1020 }, "data": { "reason": "timeout" } }
      ],
      "edges": [
        { "id": "e1", "source": "trigger", "target": "wait_1" },
        { "id": "e2", "source": "wait_1", "target": "email_1" },
        { "id": "e3", "source": "email_1", "target": "wait_2" },
        { "id": "e4", "source": "wait_2", "target": "email_2" },
        { "id": "e5", "source": "email_2", "target": "wait_3" },
        { "id": "e6", "source": "wait_3", "target": "email_3" },
        { "id": "e7", "source": "email_3", "target": "exit" }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }'::jsonb,
    TRUE,
    79
  ),
  (
    'Trial Ending',
    'trial_ending 7d before -> email -> wait 3d -> if not converted -> upgrade CTA -> wait 2d -> final offer',
    'win_back',
    'Hourglass',
    '{
      "type": "trial_ending",
      "name": "Trial Ending",
      "description": "Convert trial users before expiration.",
      "triggers": [{ "type": "event", "event": "trial_ending" }],
      "steps": [
        {
          "step": 1,
          "template": { "name": "trial_ending_1_accomplishments" },
          "delay": { "value": 0, "unit": "hours" },
          "description": "7-day heads-up"
        },
        {
          "step": 2,
          "template": { "name": "trial_ending_2_feature_comparison" },
          "delay": { "value": 3, "unit": "days" },
          "description": "Upgrade CTA"
        },
        {
          "step": 3,
          "template": { "name": "trial_ending_3_final_reminder" },
          "delay": { "value": 2, "unit": "days" },
          "description": "Final conversion offer"
        }
      ]
    }'::jsonb,
    '{
      "nodes": [
        { "id": "trigger", "type": "trigger-event", "position": { "x": 250, "y": 40 }, "data": { "event": "trial_ending", "daysBefore": 7 } },
        { "id": "email_1", "type": "action-email", "position": { "x": 250, "y": 180 }, "data": { "template": "trial_ending_1_accomplishments" } },
        { "id": "wait_1", "type": "delay-wait", "position": { "x": 250, "y": 320 }, "data": { "value": 3, "unit": "days" } },
        { "id": "email_2", "type": "action-email", "position": { "x": 250, "y": 460 }, "data": { "template": "trial_ending_2_feature_comparison" } },
        { "id": "wait_2", "type": "delay-wait", "position": { "x": 250, "y": 600 }, "data": { "value": 2, "unit": "days" } },
        { "id": "email_3", "type": "action-email", "position": { "x": 250, "y": 740 }, "data": { "template": "trial_ending_3_final_reminder" } },
        { "id": "exit", "type": "control-exit", "position": { "x": 250, "y": 880 }, "data": { "reason": "action_completed" } }
      ],
      "edges": [
        { "id": "e1", "source": "trigger", "target": "email_1" },
        { "id": "e2", "source": "email_1", "target": "wait_1" },
        { "id": "e3", "source": "wait_1", "target": "email_2" },
        { "id": "e4", "source": "email_2", "target": "wait_2" },
        { "id": "e5", "source": "wait_2", "target": "email_3" },
        { "id": "e6", "source": "email_3", "target": "exit" }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }'::jsonb,
    TRUE,
    82
  ),
  (
    'Payment Recovery',
    'payment_failed -> email -> wait 3d -> retry reminder -> wait 5d -> final warning -> exit',
    'payment',
    'CreditCard',
    '{
      "type": "dunning",
      "name": "Payment Recovery",
      "description": "Recover failed subscription payments.",
      "triggers": [{ "type": "event", "event": "payment_failed" }],
      "steps": [
        {
          "step": 1,
          "template": { "name": "dunning_1_payment_failed" },
          "delay": { "value": 0, "unit": "hours" },
          "description": "Immediate payment failure notice"
        },
        {
          "step": 2,
          "template": { "name": "dunning_2_reminder" },
          "delay": { "value": 3, "unit": "days" },
          "description": "Retry reminder"
        },
        {
          "step": 3,
          "template": { "name": "dunning_4_final_warning" },
          "delay": { "value": 5, "unit": "days" },
          "description": "Final warning before service impact"
        }
      ]
    }'::jsonb,
    '{
      "nodes": [
        { "id": "trigger", "type": "trigger-event", "position": { "x": 260, "y": 40 }, "data": { "event": "payment_failed" } },
        { "id": "email_1", "type": "action-email", "position": { "x": 260, "y": 180 }, "data": { "template": "dunning_1_payment_failed" } },
        { "id": "wait_1", "type": "delay-wait", "position": { "x": 260, "y": 320 }, "data": { "value": 3, "unit": "days" } },
        { "id": "email_2", "type": "action-email", "position": { "x": 260, "y": 460 }, "data": { "template": "dunning_2_reminder" } },
        { "id": "wait_2", "type": "delay-wait", "position": { "x": 260, "y": 600 }, "data": { "value": 5, "unit": "days" } },
        { "id": "email_3", "type": "action-email", "position": { "x": 260, "y": 740 }, "data": { "template": "dunning_4_final_warning" } },
        { "id": "exit", "type": "control-exit", "position": { "x": 260, "y": 880 }, "data": { "reason": "manual_cancel" } }
      ],
      "edges": [
        { "id": "e1", "source": "trigger", "target": "email_1" },
        { "id": "e2", "source": "email_1", "target": "wait_1" },
        { "id": "e3", "source": "wait_1", "target": "email_2" },
        { "id": "e4", "source": "email_2", "target": "wait_2" },
        { "id": "e5", "source": "wait_2", "target": "email_3" },
        { "id": "e6", "source": "email_3", "target": "exit" }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }'::jsonb,
    TRUE,
    86
  )
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_name = EXCLUDED.icon_name,
  sequence_definition = EXCLUDED.sequence_definition,
  canvas_metadata = EXCLUDED.canvas_metadata,
  is_system = EXCLUDED.is_system,
  popularity = EXCLUDED.popularity;
