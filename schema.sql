-- Shopilier accounts. Apply with:
--   npx wrangler d1 execute shopiliar-db --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ecommerce', -- always ecommerce (online stores only)
  plan TEXT NOT NULL DEFAULT 'starter',            -- starter, business or pro (the API always sets it; old rows may still say free)
  billing TEXT NOT NULL DEFAULT 'monthly',
  template TEXT NOT NULL DEFAULT 'luxe-store',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

-- The whole store dashboard (site, products, orders, pages, settings) as JSON.
CREATE TABLE IF NOT EXISTS stores (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Added after launch. On a database created before this column existed, run once:
--   ALTER TABLE users ADD COLUMN category TEXT NOT NULL DEFAULT 'ecommerce';

-- Support messages between users and the Shopilier team
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'question',   -- question, complaint, billing or website
  status TEXT NOT NULL DEFAULT 'open',     -- open or closed
  admin_unread INTEGER NOT NULL DEFAULT 0,
  user_unread INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated ON conversations(updated_at);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,                    -- user or admin
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_conversation ON messages(conversation_id, created_at);

-- Images uploaded in the website editor. The Worker also creates this table on first upload.
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                      -- image/webp, image/jpeg, image/png or image/gif
  data BLOB NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS media_user ON media(user_id);
