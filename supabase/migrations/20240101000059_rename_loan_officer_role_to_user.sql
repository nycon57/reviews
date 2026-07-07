-- Migration: Rename 'loan_officer' role to 'user'
-- This makes the role naming industry-agnostic for a broader SaaS platform

-- Step 1: Update existing records with 'loan_officer' role to 'user'
UPDATE public.users
SET role = 'user'
WHERE role = 'loan_officer';

-- Step 2: Drop the existing CHECK constraint on the role column
-- The constraint name follows the pattern: users_role_check
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Add new CHECK constraint with 'user' instead of 'loan_officer'
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'manager', 'user'));
