-- ELITE Academy — estrutura do banco D1 (membroselite)
-- O site também cria estas tabelas sozinho no primeiro acesso, se faltarem.

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  phone       TEXT    NOT NULL DEFAULT '',
  role        TEXT    NOT NULL DEFAULT 'student',   -- 'student' ou 'admin'
  pass_hash   TEXT    NOT NULL,
  pass_salt   TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login  TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT    PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- conteúdo da plataforma (cursos, módulos, aulas) em JSON
CREATE TABLE IF NOT EXISTS content (
  key         TEXT    PRIMARY KEY,
  data        TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- dados de cada aluno: aulas concluídas, dias de estudo, anotações, dúvidas
CREATE TABLE IF NOT EXISTS user_data (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data        TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
