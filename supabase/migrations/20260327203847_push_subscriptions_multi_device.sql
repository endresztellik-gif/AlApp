
-- 1. Drop the user_id unique constraint
ALTER TABLE push_subscriptions DROP CONSTRAINT push_subscriptions_user_id_key;

-- 2. Add endpoint column for unique per-device deduplication
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS endpoint TEXT;

-- 3. Backfill endpoint from existing JSONB subscriptions
UPDATE push_subscriptions SET endpoint = subscription->>'endpoint' WHERE endpoint IS NULL;

-- 4. Unique constraint on endpoint
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
