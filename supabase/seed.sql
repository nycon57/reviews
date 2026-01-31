-- RepWell Seed Data for Development
-- This script creates sample data for testing and development
-- Run with: npm run db:reset (or via Supabase CLI)

-- Clear existing data (in reverse dependency order)
TRUNCATE api_keys CASCADE;
TRUNCATE metrics_snapshots CASCADE;
TRUNCATE email_logs CASCADE;
TRUNCATE reviews CASCADE;
TRUNCATE survey_responses CASCADE;
TRUNCATE surveys CASCADE;
TRUNCATE survey_templates CASCADE;
TRUNCATE loan_officers CASCADE;
TRUNCATE users CASCADE;
TRUNCATE organizations CASCADE;

-- Insert demo organization
INSERT INTO organizations (id, name, slug, domain, primary_color, subscription_tier, subscription_status, settings)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Mortgage', 'acme-mortgage', 'acmemortgage.com', '#3B82F6', 'pro', 'active', '{"allow_auto_publish": true, "review_threshold": 4}'),
  ('22222222-2222-2222-2222-222222222222', 'Demo Lending', 'demo-lending', 'demolending.com', '#10B981', 'free', 'active', '{}');

-- Insert loan officers (these don't require auth.users since user_id is nullable)
INSERT INTO loan_officers (id, organization_id, full_name, email, phone, title, nmls_id, bio, branch, region, average_rating, total_reviews, reputation_score)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@acmemortgage.com', '555-123-4567', 'Senior Loan Officer', 'NMLS123456', 'Over 15 years of experience helping families achieve their dream of homeownership.', 'Downtown', 'West', 4.85, 127, 92),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Sarah Johnson', 'sarah.johnson@acmemortgage.com', '555-234-5678', 'Loan Officer', 'NMLS234567', 'Specializing in first-time homebuyer programs and VA loans.', 'Suburban', 'West', 4.72, 89, 85),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Michael Chen', 'michael.chen@acmemortgage.com', '555-345-6789', 'Loan Officer', 'NMLS345678', 'Fluent in Mandarin and English. Committed to excellent service.', 'Downtown', 'East', 4.91, 156, 95),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Emily Davis', 'emily.davis@demolending.com', '555-456-7890', 'Branch Manager', 'NMLS456789', 'Leading our team to deliver exceptional mortgage solutions.', 'Main', 'Central', 4.68, 72, 80);

-- Insert survey templates
INSERT INTO survey_templates (id, organization_id, name, description, is_default, is_active, questions, branding, thank_you_config)
VALUES
  ('tttttttt-tttt-tttt-tttt-tttttttttttt', '11111111-1111-1111-1111-111111111111', 'Post-Transaction Survey', 'Standard survey sent after loan closing', true, true,
   '[
     {"id": "q1", "type": "star_rating", "question": "How would you rate your overall experience?", "required": true},
     {"id": "q2", "type": "nps", "question": "How likely are you to recommend us to friends and family?", "required": true},
     {"id": "q3", "type": "text", "question": "What did you like most about working with us?", "required": false},
     {"id": "q4", "type": "text", "question": "How could we improve our service?", "required": false},
     {"id": "q5", "type": "multiple_choice", "question": "Would you use us again for future mortgage needs?", "options": ["Definitely", "Probably", "Not sure", "Probably not"], "required": true}
   ]',
   '{"logo_url": null, "primary_color": "#3B82F6", "company_name": "Acme Mortgage"}',
   '{"title": "Thank You!", "message": "We appreciate your feedback. Your review helps us improve and helps other families find the right mortgage partner.", "show_review_prompt": true, "review_platforms": ["google", "zillow"]}'
  ),
  ('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', '11111111-1111-1111-1111-111111111111', 'Quick NPS Survey', 'Short survey for quick feedback', false, true,
   '[
     {"id": "q1", "type": "nps", "question": "How likely are you to recommend us?", "required": true},
     {"id": "q2", "type": "text", "question": "Any additional comments?", "required": false}
   ]',
   '{"logo_url": null, "primary_color": "#3B82F6", "company_name": "Acme Mortgage"}',
   '{"title": "Thanks!", "message": "Your feedback is valuable to us."}'
  );

-- Insert sample surveys
INSERT INTO surveys (id, organization_id, template_id, loan_officer_id, customer_name, customer_email, customer_phone, transaction_type, status, sent_at, completed_at, source)
VALUES
  ('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'tttttttt-tttt-tttt-tttt-tttttttttttt', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Robert Williams', 'robert.williams@email.com', '555-111-2222', 'purchase', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'webhook'),
  ('s2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'tttttttt-tttt-tttt-tttt-tttttttttttt', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maria Garcia', 'maria.garcia@email.com', '555-222-3333', 'refinance', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', 'manual'),
  ('s3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'tttttttt-tttt-tttt-tttt-tttttttttttt', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'James Thompson', 'james.thompson@email.com', '555-333-4444', 'purchase', 'completed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days', 'webhook'),
  ('s4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Linda Brown', 'linda.brown@email.com', '555-444-5555', 'purchase', 'sent', NOW() - INTERVAL '2 days', NULL, 'manual'),
  ('s5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'David Lee', 'david.lee@email.com', '555-555-6666', 'refinance', 'pending', NULL, NULL, 'manual');

-- Insert survey responses
INSERT INTO survey_responses (id, survey_id, answers, overall_rating, nps_score, testimonial_text, sentiment_score, sentiment_label, themes)
VALUES
  ('r1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111',
   '{"q1": 5, "q2": 10, "q3": "John was incredibly helpful throughout the entire process. He always answered my calls and explained everything clearly.", "q4": "Maybe some automated updates would be nice.", "q5": "Definitely"}',
   5, 10, 'John was incredibly helpful throughout the entire process. He always answered my calls and explained everything clearly.', 0.92, 'positive', ARRAY['communication', 'service', 'responsiveness']),
  ('r2222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222222',
   '{"q1": 4, "q2": 8, "q3": "The refinance process was smooth. Good rates.", "q4": "The paperwork took a bit longer than expected.", "q5": "Probably"}',
   4, 8, 'The refinance process was smooth. Good rates.', 0.75, 'positive', ARRAY['process', 'rates']),
  ('r3333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333333',
   '{"q1": 5, "q2": 9, "q3": "Sarah helped us get into our first home! She made the complex process easy to understand.", "q4": "", "q5": "Definitely"}',
   5, 9, 'Sarah helped us get into our first home! She made the complex process easy to understand.', 0.88, 'positive', ARRAY['first-time buyer', 'education', 'process']);

-- Insert reviews (from surveys and external sources)
INSERT INTO reviews (id, organization_id, loan_officer_id, source, survey_response_id, rating, title, text, customer_name, sentiment_score, sentiment_label, themes, status, is_published, review_date)
VALUES
  -- Internal reviews from surveys
  ('rev11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal', 'r1111111-1111-1111-1111-111111111111', 5, 'Excellent Service!', 'John was incredibly helpful throughout the entire process. He always answered my calls and explained everything clearly.', 'Robert W.', 0.92, 'positive', ARRAY['communication', 'service'], 'approved', true, NOW() - INTERVAL '8 days'),
  ('rev22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal', 'r2222222-2222-2222-2222-222222222222', 4, 'Good Experience', 'The refinance process was smooth. Good rates.', 'Maria G.', 0.75, 'positive', ARRAY['process', 'rates'], 'approved', true, NOW() - INTERVAL '5 days'),
  ('rev33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'internal', 'r3333333-3333-3333-3333-333333333333', 5, 'First-Time Homebuyer Success', 'Sarah helped us get into our first home! She made the complex process easy to understand.', 'James T.', 0.88, 'positive', ARRAY['first-time buyer', 'education'], 'approved', true, NOW() - INTERVAL '12 days'),

  -- External Google reviews
  ('rev44444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'google', NULL, 5, NULL, 'Best mortgage experience ever! John made everything so easy. Highly recommend!', 'Mike R.', 0.95, 'positive', ARRAY['ease', 'recommendation'], 'approved', true, NOW() - INTERVAL '30 days'),
  ('rev55555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'google', NULL, 5, NULL, 'Michael was amazing! He explained every step and got us a great rate. Very professional.', 'Jennifer L.', 0.91, 'positive', ARRAY['professionalism', 'rates', 'communication'], 'approved', true, NOW() - INTERVAL '20 days'),
  ('rev66666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'google', NULL, 4, NULL, 'Good service overall. Sarah was helpful but the closing took longer than expected.', 'Tom K.', 0.65, 'positive', ARRAY['service', 'timeline'], 'approved', true, NOW() - INTERVAL '45 days'),

  -- Pending review
  ('rev77777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'internal', NULL, 5, 'Outstanding!', 'Michael went above and beyond. Can''t thank him enough for helping us through a complex situation.', 'Amy H.', 0.94, 'positive', ARRAY['service', 'expertise'], 'pending', false, NOW() - INTERVAL '1 day');

-- Insert sample email logs
INSERT INTO email_logs (organization_id, to_email, to_name, from_email, from_name, subject, template_name, survey_id, loan_officer_id, status, sent_at, delivered_at, opened_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'robert.williams@email.com', 'Robert Williams', 'surveys@acmemortgage.com', 'Acme Mortgage', 'How was your experience with John Smith?', 'survey_invitation', 's1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'opened', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111', 'maria.garcia@email.com', 'Maria Garcia', 'surveys@acmemortgage.com', 'Acme Mortgage', 'How was your experience with John Smith?', 'survey_invitation', 's2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'clicked', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'linda.brown@email.com', 'Linda Brown', 'surveys@acmemortgage.com', 'Acme Mortgage', 'How was your experience with Michael Chen?', 'survey_invitation', 's4444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'delivered', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL);

-- Insert metrics snapshots
INSERT INTO metrics_snapshots (organization_id, loan_officer_id, period_type, period_start, period_end, metrics)
VALUES
  -- Org-level monthly metrics
  ('11111111-1111-1111-1111-111111111111', NULL, 'monthly', '2025-12-01', '2025-12-31', '{"total_reviews": 45, "average_rating": 4.78, "nps_score": 72, "response_rate": 0.68, "survey_sent": 66, "survey_completed": 45}'),
  ('11111111-1111-1111-1111-111111111111', NULL, 'monthly', '2026-01-01', '2026-01-31', '{"total_reviews": 12, "average_rating": 4.82, "nps_score": 75, "response_rate": 0.71, "survey_sent": 17, "survey_completed": 12}'),

  -- LO-level monthly metrics
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'monthly', '2026-01-01', '2026-01-31', '{"total_reviews": 4, "average_rating": 4.75, "nps_score": 70, "response_rate": 0.80}'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'monthly', '2026-01-01', '2026-01-31', '{"total_reviews": 3, "average_rating": 4.67, "nps_score": 67, "response_rate": 0.60}'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'monthly', '2026-01-01', '2026-01-31', '{"total_reviews": 5, "average_rating": 4.90, "nps_score": 85, "response_rate": 0.75}');

-- SMS Settings (sample config for Acme Mortgage)
INSERT INTO sms_settings (id, organization_id, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, use_recipient_timezone, monthly_message_limit, double_opt_in_enabled, registration_status, brand_name, auto_follow_up_enabled, auto_follow_up_delay_hours)
VALUES
  ('ee000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', true, '21:00', '08:00', 'America/New_York', false, 1000, false, 'not_started', 'Acme Mortgage', true, 72);

-- SMS Templates (3 default templates for Acme Mortgage)
INSERT INTO sms_templates (id, organization_id, name, category, body, merge_fields, is_locked, is_default, status)
VALUES
  ('ee000002-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Review Request', 'review_request',
   'Hi {{first_name}}, thanks for working with {{lo_name}} at {{company_name}}! We''d love your feedback. Share your experience here: {{review_link}} Reply STOP to opt out.',
   '["first_name", "lo_name", "company_name", "review_link"]', true, true, 'active'),
  ('ee000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Follow-Up Reminder', 'follow_up',
   'Hi {{first_name}}, just a friendly reminder from {{company_name}}. We''d really appreciate your feedback on your recent experience with {{lo_name}}: {{review_link}} Reply STOP to opt out.',
   '["first_name", "lo_name", "company_name", "review_link"]', true, true, 'active'),
  ('ee000002-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Thank You', 'thank_you',
   'Thank you, {{first_name}}! Your review of {{lo_name}} at {{company_name}} means a lot to us. We appreciate your trust. Reply STOP to opt out.',
   '["first_name", "lo_name", "company_name"]', true, true, 'active');

-- Verify seed data
DO $$
DECLARE
  org_count INT;
  lo_count INT;
  review_count INT;
  sms_template_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO lo_count FROM loan_officers;
  SELECT COUNT(*) INTO review_count FROM reviews;
  SELECT COUNT(*) INTO sms_template_count FROM sms_templates;

  RAISE NOTICE 'Seed complete: % organizations, % loan officers, % reviews, % sms templates', org_count, lo_count, review_count, sms_template_count;
END $$;
