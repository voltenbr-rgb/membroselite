/* ==================================================================
   ELITE Academy — API (Cloudflare Pages Functions + D1)
   Precisa da ligação D1 com o nome "DB" no projeto do Pages.

   GET    /api/me                 sessão atual (+ se precisa criar o Master)
   POST   /api/setup              cria a primeira conta Master (só se não houver)
   POST   /api/login              e-mail + senha
   POST   /api/logout
   PATCH  /api/me                 nome, telefone, troca de senha
   GET    /api/vitrine            vitrine pública (resumo dos cursos à venda)
   GET    /api/content            cursos (aluno: sem as aulas dos cursos bloqueados)
   PUT    /api/content            salva cursos (Master)
   GET    /api/progress           dados do aluno (concluídas, anotações...)
   PUT    /api/progress
   GET    /api/admin/users        alunos (Master)
   POST   /api/admin/users        cria aluno
   PATCH  /api/admin/users/:id    edita / redefine senha
   DELETE /api/admin/users/:id    remove aluno
   ================================================================== */

const SESSION_DAYS = 30;
const COOKIE = 'elite_sid';
const MAX_JSON = 900_000;          // limite de segurança por gravação
const PBKDF2_ITER = 100_000;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'student', pass_hash TEXT NOT NULL, pass_salt TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), last_login TEXT)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS content (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS user_data (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`
];
let schemaReady = false;
async function ensureSchema(db){
  if(schemaReady) return;
  await db.batch(SCHEMA.map(s => db.prepare(s)));
  schemaReady = true;
}

/* ---------------- utilitários ---------------- */
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers}});
const fail = (status, error) => json({error}, status);
const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
function randomHex(bytes = 32){ const a = new Uint8Array(bytes); crypto.getRandomValues(a); return toHex(a); }
async function sha256(text){ return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text))); }
async function hashPassword(password, saltHex){
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITER}, key, 256);
  return toHex(bits);
}
function safeEqual(a, b){ if(a.length !== b.length) return false; let r = 0; for(let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
function cleanEmail(e){ return String(e || '').trim().toLowerCase(); }
function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 160; }
function cleanText(t, max = 120){ return String(t || '').trim().slice(0, max); }
function publicUser(u){ return u ? {id: u.id, name: u.name, email: u.email, phone: u.phone || '', role: u.role} : null; }
async function readJson(request){
  const text = await request.text();
  if(text.length > MAX_JSON) throw Object.assign(new Error('grande demais'), {status: 413});
  try { return text ? JSON.parse(text) : {}; } catch(e){ throw Object.assign(new Error('JSON inválido'), {status: 400}); }
}
function cookieFor(token, request){
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return token
    ? `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`
    : `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
function readCookie(request){
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}

/* ---------------- sessão ---------------- */
async function currentUser(db, request){
  const token = readCookie(request); if(!token) return null;
  const row = await db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`).bind(await sha256(token), Date.now()).first();
  return row || null;
}
async function startSession(db, userId){
  const token = randomHex(32);
  await db.batch([
    db.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(Date.now()),
    db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).bind(await sha256(token), userId, Date.now() + SESSION_DAYS * 86400_000),
    db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).bind(userId)
  ]);
  return token;
}
async function createUser(db, {name, email, phone = '', password, role = 'student'}){
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const r = await db.prepare(`INSERT INTO users (name, email, phone, role, pass_hash, pass_salt) VALUES (?, ?, ?, ?, ?, ?)`).bind(name, email, phone, role, hash, salt).run();
  return r.meta?.last_row_id;
}
function checkNewUser({name, email, password}){
  if(!name) return 'Informe o nome.';
  if(!validEmail(email)) return 'Informe um e-mail válido.';
  if(!password || String(password).length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  return null;
}

/* ---------------- conteúdo ---------------- */
// aluno não recebe as aulas (links) dos cursos bloqueados — só o resumo para a página de venda
function forStudent(courses){
  return courses.map(c => c.locked
    ? {...c, modules: (c.modules || []).map(m => ({name: m.name, lessons: (m.lessons || []).map(l => ({title: l.title, type: l.type, min: l.min}))}))}
    : c);
}

function storeSummary(courses){
  return courses.filter(c => c.showInStore !== false).map(c => ({
    id: c.id, name: c.name, desc: c.desc || '', tag: c.tag || '', color: c.color || 'green', code: c.code || '',
    coverUrl: c.coverUrl || '', price: c.price || '', checkoutUrl: c.checkoutUrl || '', trailerUrl: c.trailerUrl || '',
    learn: c.learn || [], featured: !!c.featured,
    modules: (c.modules || []).map(m => ({name: m.name, lessons: (m.lessons || []).length, min: (m.lessons || []).reduce((a, l) => a + (+l.min || 0), 0)}))
  }));
}

/* ---------------- roteador ---------------- */
export async function onRequest(context){
  const {request, env, params} = context;
  const db = env.DB;
  if(!db) return fail(503, 'Banco de dados não conectado (ligação DB ausente).');
  const path = '/' + [].concat(params.path || []).join('/');
  const method = request.method;
  try {
    await ensureSchema(db);
    const me = await currentUser(db, request);
    const isAdmin = me?.role === 'admin';

    if(path === '/me' && method === 'GET'){
      const admins = await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`).first();
      return json({user: publicUser(me), needsSetup: !admins?.n});
    }

    if(path === '/setup' && method === 'POST'){
      const admins = await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`).first();
      if(admins?.n) return fail(403, 'A conta Master já foi criada.');
      const b = await readJson(request);
      const data = {name: cleanText(b.name), email: cleanEmail(b.email), password: String(b.password || ''), role: 'admin'};
      const err = checkNewUser(data); if(err) return fail(400, err);
      const id = await createUser(db, data);
      const token = await startSession(db, id);
      const user = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
      return json({user: publicUser(user)}, 200, {'set-cookie': cookieFor(token, request)});
    }

    if(path === '/login' && method === 'POST'){
      const b = await readJson(request);
      const email = cleanEmail(b.email), password = String(b.password || '');
      const u = email ? await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first() : null;
      const hash = await hashPassword(password, u ? u.pass_salt : '00'.repeat(16));   // mesmo custo com ou sem usuário
      if(!u || !safeEqual(hash, u.pass_hash)) return fail(401, 'E-mail ou senha incorretos.');
      const token = await startSession(db, u.id);
      return json({user: publicUser(u)}, 200, {'set-cookie': cookieFor(token, request)});
    }

    if(path === '/logout' && method === 'POST'){
      const token = readCookie(request);
      if(token) await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(await sha256(token)).run();
      return json({ok: true}, 200, {'set-cookie': cookieFor(null, request)});
    }

    // vitrine pública: só o resumo dos cursos (sem links das aulas)
    if(path === '/vitrine' && method === 'GET'){
      const row = await db.prepare(`SELECT data FROM content WHERE key = 'courses'`).first();
      if(!row) return json({courses: null});
      return json({courses: storeSummary(JSON.parse(row.data))});
    }

    // ---- daqui para baixo, só com login ----
    if(!me) return fail(401, 'Faça login para continuar.');

    if(path === '/me' && method === 'PATCH'){
      const b = await readJson(request);
      const name = b.name != null ? cleanText(b.name) : me.name;
      const phone = b.phone != null ? cleanText(b.phone, 30) : me.phone;
      if(!name) return fail(400, 'Informe o nome.');
      if(b.newPassword){
        if(String(b.newPassword).length < 6) return fail(400, 'A nova senha precisa ter pelo menos 6 caracteres.');
        const cur = await hashPassword(String(b.password || ''), me.pass_salt);
        if(!safeEqual(cur, me.pass_hash)) return fail(400, 'Senha atual incorreta.');
        const salt = randomHex(16);
        await db.prepare(`UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?`).bind(await hashPassword(String(b.newPassword), salt), salt, me.id).run();
      }
      await db.prepare(`UPDATE users SET name = ?, phone = ? WHERE id = ?`).bind(name, phone, me.id).run();
      return json({user: publicUser({...me, name, phone})});
    }

    if(path === '/content' && method === 'GET'){
      const row = await db.prepare(`SELECT data, updated_at FROM content WHERE key = 'courses'`).first();
      if(!row) return json({courses: null});
      const courses = JSON.parse(row.data);
      return json({courses: isAdmin ? courses : forStudent(courses), updatedAt: row.updated_at});
    }
    if(path === '/content' && method === 'PUT'){
      if(!isAdmin) return fail(403, 'Apenas o Master pode alterar o conteúdo.');
      const b = await readJson(request);
      if(!Array.isArray(b.courses) || !b.courses.every(c => c && c.id && c.name && Array.isArray(c.modules))) return fail(400, 'Conteúdo inválido.');
      await db.prepare(`INSERT INTO content (key, data, updated_at) VALUES ('courses', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`).bind(JSON.stringify(b.courses)).run();
      return json({ok: true});
    }

    if(path === '/progress' && method === 'GET'){
      const row = await db.prepare(`SELECT data FROM user_data WHERE user_id = ?`).bind(me.id).first();
      return json({data: row ? JSON.parse(row.data) : null});
    }
    if(path === '/progress' && method === 'PUT'){
      const b = await readJson(request);
      const d = b.data || {};
      const data = {
        completed: Array.isArray(d.completed) ? d.completed.filter(x => typeof x === 'string').slice(0, 5000) : [],
        days: Array.isArray(d.days) ? d.days.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x)).slice(-366) : [],
        notes: d.notes && typeof d.notes === 'object' ? d.notes : {},
        questions: d.questions && typeof d.questions === 'object' ? d.questions : {}
      };
      await db.prepare(`INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`).bind(me.id, JSON.stringify(data)).run();
      return json({ok: true});
    }

    // ---- Master: alunos ----
    if(path.startsWith('/admin/')){
      if(!isAdmin) return fail(403, 'Acesso restrito ao Master.');
      if(path === '/admin/users' && method === 'GET'){
        const {results} = await db.prepare(`SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_login, d.data, d.updated_at AS active_at FROM users u LEFT JOIN user_data d ON d.user_id = u.id ORDER BY u.role = 'admin' DESC, u.created_at DESC`).all();
        return json({users: results.map(r => {
          let completed = [], questions = 0;
          try { const d = JSON.parse(r.data || '{}'); completed = d.completed || []; questions = Object.values(d.questions || {}).reduce((a, q) => a + (q?.length || 0), 0); } catch(e) {}
          return {id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role, createdAt: r.created_at, lastLogin: r.last_login, activeAt: r.active_at, completed, questions};
        })});
      }
      if(path === '/admin/users' && method === 'POST'){
        const b = await readJson(request);
        const data = {name: cleanText(b.name), email: cleanEmail(b.email), phone: cleanText(b.phone, 30), password: String(b.password || ''), role: b.role === 'admin' ? 'admin' : 'student'};
        const err = checkNewUser(data); if(err) return fail(400, err);
        const exists = await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(data.email).first();
        if(exists) return fail(409, 'Já existe uma conta com esse e-mail.');
        const id = await createUser(db, data);
        return json({id});
      }
      const m = path.match(/^\/admin\/users\/(\d+)$/);
      if(m){
        const id = +m[1];
        const u = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
        if(!u) return fail(404, 'Aluno não encontrado.');
        if(method === 'PATCH'){
          const b = await readJson(request);
          const name = b.name != null ? cleanText(b.name) : u.name;
          const phone = b.phone != null ? cleanText(b.phone, 30) : u.phone;
          const email = b.email != null ? cleanEmail(b.email) : u.email;
          if(!name) return fail(400, 'Informe o nome.');
          if(!validEmail(email)) return fail(400, 'Informe um e-mail válido.');
          if(email !== u.email){ const ex = await db.prepare(`SELECT id FROM users WHERE email = ? AND id <> ?`).bind(email, id).first(); if(ex) return fail(409, 'Já existe uma conta com esse e-mail.'); }
          const stmts = [db.prepare(`UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?`).bind(name, phone, email, id)];
          if(b.password){
            if(String(b.password).length < 6) return fail(400, 'A senha precisa ter pelo menos 6 caracteres.');
            const salt = randomHex(16);
            stmts.push(db.prepare(`UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?`).bind(await hashPassword(String(b.password), salt), salt, id));
            stmts.push(db.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id));   // desconecta o aluno
          }
          await db.batch(stmts);
          return json({ok: true});
        }
        if(method === 'DELETE'){
          if(id === me.id) return fail(400, 'Você não pode excluir a sua própria conta.');
          await db.batch([
            db.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id),
            db.prepare(`DELETE FROM user_data WHERE user_id = ?`).bind(id),
            db.prepare(`DELETE FROM users WHERE id = ?`).bind(id)
          ]);
          return json({ok: true});
        }
      }
    }
    return fail(404, 'Rota não encontrada.');
  } catch(err){
    if(err.status) return fail(err.status, err.message);
    console.error(err);
    return fail(500, 'Erro interno. Tente novamente.');
  }
}
