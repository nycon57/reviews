-- Auto-assign branch manager when branch membership changes
-- Rules:
--   1 active user  → set manager_id to that user
--   0 active users → clear manager_id
--   2+ users with existing manager → no change

CREATE OR REPLACE FUNCTION fn_auto_assign_branch_manager()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
  v_active_count INT;
  v_sole_user_id UUID;
  v_current_manager UUID;
BEGIN
  -- Determine which branch was affected
  IF TG_OP = 'DELETE' THEN
    v_branch_id := OLD.branch_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle both old and new branch when branch_id changes
    IF OLD.branch_id IS DISTINCT FROM NEW.branch_id THEN
      -- Process the OLD branch (user left)
      IF OLD.branch_id IS NOT NULL THEN
        SELECT COUNT(*), MIN(id)
          INTO v_active_count, v_sole_user_id
          FROM users
         WHERE branch_id = OLD.branch_id AND is_active = true;

        SELECT manager_id INTO v_current_manager
          FROM branches WHERE id = OLD.branch_id;

        IF v_active_count = 0 THEN
          UPDATE branches SET manager_id = NULL WHERE id = OLD.branch_id;
        ELSIF v_active_count = 1 THEN
          UPDATE branches SET manager_id = v_sole_user_id WHERE id = OLD.branch_id;
        ELSIF v_current_manager IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM users WHERE id = v_current_manager AND branch_id = OLD.branch_id AND is_active = true) THEN
          -- Current manager left this branch; pick the sole user if 1, else clear
          IF v_active_count = 1 THEN
            UPDATE branches SET manager_id = v_sole_user_id WHERE id = OLD.branch_id;
          ELSE
            UPDATE branches SET manager_id = NULL WHERE id = OLD.branch_id;
          END IF;
        END IF;
      END IF;
      -- Fall through to process the NEW branch below
      v_branch_id := NEW.branch_id;
    ELSE
      -- branch_id didn't change; check is_active toggle
      IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
        v_branch_id := NEW.branch_id;
      ELSE
        RETURN NEW;
      END IF;
    END IF;
  ELSE
    -- INSERT
    v_branch_id := NEW.branch_id;
  END IF;

  -- Process the target branch
  IF v_branch_id IS NOT NULL THEN
    SELECT COUNT(*), MIN(id)
      INTO v_active_count, v_sole_user_id
      FROM users
     WHERE branch_id = v_branch_id AND is_active = true;

    SELECT manager_id INTO v_current_manager
      FROM branches WHERE id = v_branch_id;

    IF v_active_count = 0 THEN
      UPDATE branches SET manager_id = NULL WHERE id = v_branch_id;
    ELSIF v_active_count = 1 THEN
      UPDATE branches SET manager_id = v_sole_user_id WHERE id = v_branch_id;
    -- 2+ users and no current manager → don't auto-assign
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_branch_manager
  AFTER INSERT OR UPDATE OF branch_id, is_active OR DELETE
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_assign_branch_manager();
