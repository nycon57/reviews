-- Contact self-serve unsubscribe token (ADR 0004; Grill #2 decision 6).
--
-- The acquisition unsubscribe end-state is a Contact-scoped public page at
-- /u/c/[token] that writes a Suppression. That page needs a non-guessable,
-- per-Contact handle that is safe to embed in an email footer. We store it as a
-- random hex column on the Contact rather than an HMAC so the public lookup is a
-- single indexed equality with no secret-management surface — the same house
-- pattern already used for surveys.token and video_testimonial_requests.token.
--
-- Additive-only. A volatile DEFAULT means every existing Contact (from B1's
-- backfill) is assigned a distinct token during this migration's rewrite, and
-- every future insert gets one automatically, so the send path never has to
-- generate one lazily.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT NOT NULL
    DEFAULT encode(gen_random_bytes(16), 'hex');

-- Public page looks a Contact up by this token; uniqueness is the enumeration
-- backstop (a 16-byte random value is already non-guessable).
CREATE UNIQUE INDEX IF NOT EXISTS contacts_unsubscribe_token_unique
  ON contacts (unsubscribe_token);
