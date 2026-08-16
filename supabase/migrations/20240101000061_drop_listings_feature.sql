-- Migration: Drop Business Listings Feature
-- Description: Removes all listings-related tables, functions, triggers, and enums
-- Reason: Feature removed from product scope due to high maintenance costs and API integration complexity
-- Note: Uses CASCADE to handle dependencies; safe to run even if objects don't exist

-- Drop functions FIRST (before tables) to avoid "type does not exist" errors
-- Functions must be dropped before tables because some reference table composite types
DROP FUNCTION IF EXISTS auto_initialize_directories();
DROP FUNCTION IF EXISTS initialize_listing_directories(UUID, UUID);
DROP FUNCTION IF EXISTS create_nap_mismatch_alert();
DROP FUNCTION IF EXISTS detect_listing_duplicates(UUID);
DROP FUNCTION IF EXISTS update_listing_accuracy();
DROP FUNCTION IF EXISTS calculate_listing_accuracy(business_listings);

-- Drop tables with CASCADE (this automatically drops triggers, policies, and dependent objects)
DROP TABLE IF EXISTS listing_alerts CASCADE;
DROP TABLE IF EXISTS listing_changes_audit CASCADE;
DROP TABLE IF EXISTS listing_accuracy_history CASCADE;
DROP TABLE IF EXISTS listing_sync_logs CASCADE;
DROP TABLE IF EXISTS directory_connections CASCADE;
DROP TABLE IF EXISTS business_listings CASCADE;

-- Drop enums (IF EXISTS handles case where they don't exist)
DROP TYPE IF EXISTS listing_sync_status;
DROP TYPE IF EXISTS directory_platform;
