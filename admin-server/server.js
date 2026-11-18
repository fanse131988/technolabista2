#!/usr/bin/env node
/**
 * TechnoLAB-ISTA — serveur de contenu partagé (Task 13)
 * ------------------------------------------------------------------
 * Permet à plusieurs administrateurs / éditeurs de travailler ensemble :
 *   • comptes centralisés (rôles admin / editeur), mots de passe scrypt salés
 *   • contenu commun (JSON) lu et écrit via API sécurisée par jeton
 *   • journal centralisé de toutes les modifications
 *   • sauvegardes automatiques horodatées
 *
 * Démarrage :
 *   cd admin-server && npm install && ADMIN_PASSWORD='MonMotDePasse!' npm start
 *   puis ouvrir http://localhost:8080
 *
 * Zéro dépendance externe : Node.js 18+ suffit (http natif).
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const SITE_FILE = process.env.SITE_FILE || path.join(ROOT, '..', 'uploads', 'index.html');
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);
const BOOT_PASSWORD = process.env.ADMIN_PASSWORD || 'TechnoLAB2026';

const F_USERS = path.join(DATA_DIR, 'users.json');
const F_CONTENT = path.join(DATA_DIR, 'content.json');
const F_SITE = path.join(DATA_DIR, 'site.json');
const F_LOG = path.join(DATA_DIR, 'log.json');
const F_BACK = path.join(DATA_DIR, 'backups');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(F_BACK, { recursive: true });

/* ----------------------------------------------------------------- utilitaires */
const readJson = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return fb; } };
const ensureDirs = () => { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.mkdirSync(F_BACK, { recursive: true }); } catch (e) {} };
ensureDirs();
const writeJson = (f, v) => {
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(v, null, 1));
  fs.renameSync(tmp, f);
};
const logEvent = (who, action) => {
  const l = readJson(F_LOG, []);
  l.unshift({ at: new Date().toISOString(), who: who || '—', action });
  writeJson(F_LOG, l.slice(0, 2000));
};
const hashPassword = (pwd) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pwd), salt, 64).toString('hex');
  return { salt, hash };
};
const verifyPassword = (pwd, salt, hash) => {
  try {
    const h = crypto.scryptSync(String(pwd), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) { return false; }
};

/* -------------------------------------------------------------------- comptes */
/* Un seul administrateur : identifiant « admin », mot de passe défini par
   ADMIN_PASSWORD au premier démarrage (puis modifiable depuis la console). */
let users = readJson(F_USERS, null);
if (!users || !users.length) {
  const { salt, hash } = hashPassword(BOOT_PASSWORD);
  users = [{
    id: 'u-admin', name: 'Administrateur', login: 'admin', role: 'admin',
    active: true, salt, hash, created: new Date().toISOString(), mustChange: true
  }];
  writeJson(F_USERS, users);
  logEvent('système', 'Création du compte administrateur');
}
const saveUsers = () => writeJson(F_USERS, users);

/* -------------------------------------------------------------------- contenu */
if (!fs.existsSync(F_CONTENT)) writeJson(F_CONTENT, { version: 0, updatedAt: null, pages: {} });

/* --------------------------------------------------------------------- jetons */
const sessions = new Map(); // token -> { login, role, exp }
const newToken = (u) => {
  const t = crypto.randomBytes(24).toString('hex');
  sessions.set(t, { login: u.login, role: u.role, exp: Date.now() + SESSION_HOURS * 3600e3 });
  return t;
};
const authUser = (req) => {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const s = sessions.get(t);
  if (!s || s.exp < Date.now()) { sessions.delete(t); return null; }
  return s;
};
const attempts = new Map(); // anti force brute : 8 essais / 10 min / IP
const tooMany = (ip) => {
  const a = attempts.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - a.t > 600e3) { a.n = 0; a.t = Date.now(); }
  a.n++; attempts.set(ip, a);
  return a.n > 8;
};

/* ------------------------------------------------------------------- réponses */
const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(body);
};
const body = (req) => new Promise((resolve, reject) => {
  let d = '';
  req.on('data', (c) => { d += c; if (d.length > 12e6) reject(new Error('payload trop volumineux')); });
  req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { reject(e); } });
  req.on('error', reject);
});

/* ------------------------------------------------------------------------ API */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const p = url.pathname;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

  if (req.method === 'OPTIONS') return json(res, 204, {});

  // --- connexion
  if (p === '/api/login' && req.method === 'POST') {
    if (tooMany(ip)) return json(res, 429, { error: 'Trop de tentatives, réessayez dans quelques minutes.' });
    try {
      const b = await body(req);
      const u = users.find((x) => String(x.login).toLowerCase() === String(b.login || '').trim().toLowerCase());
      if (!u || !u.active || !verifyPassword(b.password || '', u.salt, u.hash)) {
        logEvent(b.login || '?', 'Tentative de connexion échouée');
        return json(res, 401, { error: 'Identifiant ou mot de passe incorrect.' });
      }
      const token = newToken(u);
      logEvent(u.login, 'Connexion');
      return json(res, 200, { token, user: { id: u.id, login: u.login, name: u.name, role: u.role } });
    } catch (e) { return json(res, 400, { error: 'Requête invalide.' }); }
  }

  // --- jeton de session
  if (p === '/api/me') {
    const s = authUser(req);
    if (!s) return json(res, 401, { error: 'Session expirée.' });
    const u = users.find((x) => x.login === s.login) || {};
    return json(res, 200, { user: { login: u.login, name: u.name, role: u.role } });
  }

  // --- contenu publié (lecture publique, écriture authentifiée)
  if (p === '/api/content') {
    if (req.method === 'GET') {
      return json(res, 200, { data: readJson(F_CONTENT, {}) });
    }
    const s = authUser(req);
    if (!s) return json(res, 401, { error: 'Authentification requise.' });
    try {
      const b = await body(req);
      const payload = b && b.data ? b.data : b;
      if (!payload || typeof payload !== 'object') return json(res, 400, { error: 'Contenu invalide.' });
      payload.version = (readJson(F_CONTENT, {}).version || 0) + 1;
      payload.updatedAt = new Date().toISOString();
      payload.updatedBy = s.login;
      writeJson(F_CONTENT, payload);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      writeJson(path.join(F_BACK, 'content-' + stamp + '.json'), payload);
      const files = fs.readdirSync(F_BACK).sort();
      files.slice(0, Math.max(0, files.length - 60)).forEach((f) => {
        try { fs.unlinkSync(path.join(F_BACK, f)); } catch (e) {}
      });
      logEvent(s.login, 'Publication du contenu (v' + payload.version + ')');
      return json(res, 200, { ok: true, version: payload.version });
    } catch (e) { return json(res, 400, { error: 'Contenu illisible.' }); }
  }

  // --- changement du mot de passe de l'administrateur
  if (p === '/api/password' && (req.method === 'POST' || req.method === 'PUT')) {
    const s2 = authUser(req);
    if (!s2) return json(res, 401, { error: 'Authentification requise.' });
    try {
      const b = await body(req);
      const u = users.find((x) => x.login === s2.login);
      if (!u) return json(res, 404, { error: 'Compte introuvable.' });
      if (!verifyPassword(b.current || '', u.salt, u.hash)) return json(res, 400, { error: 'Mot de passe actuel incorrect.' });
      if (!b.next || String(b.next).length < 8) return json(res, 400, { error: 'Nouveau mot de passe : 8 caractères minimum.' });
      const h = hashPassword(b.next);
      u.salt = h.salt; u.hash = h.hash; u.mustChange = false;
      saveUsers();
      logEvent(u.login, 'Changement du mot de passe');
      return json(res, 200, { ok: true });
    } catch (e) { return json(res, 400, { error: 'Requête invalide.' }); }
  }

  // --- journal
  if (p === '/api/log') {
    const s = authUser(req);
    if (!s) return json(res, 401, { error: 'Authentification requise.' });
    return json(res, 200, { log: readJson(F_LOG, []).slice(0, 200) });
  }

  // --- sauvegarde / restauration du contenu
  if (p === '/api/backup' && req.method === 'GET') {
    const s = authUser(req);
    if (!s || s.role !== 'admin') return json(res, 403, { error: 'Réservé aux administrateurs.' });
    return json(res, 200, { content: readJson(F_CONTENT, {}), users: users.map((u) => ({ id: u.id, login: u.login, name: u.name, role: u.role, active: u.active })), log: readJson(F_LOG, []) });
  }

  // --- rubriques des pages (structure compacte : écarts seulement)
  if (p === '/api/site') {
    if (req.method === 'GET') {
      return json(res, 200, { data: readJson(F_SITE, null) });
    }
    const s = authUser(req);
    if (!s) return json(res, 401, { error: 'Authentification requise.' });
    try {
      const b = await body(req);
      const payload = b && b.data ? b.data : b;
      if (!payload || typeof payload !== 'object' || !payload.site) return json(res, 400, { error: 'Rubriques invalides.' });
      const prev = readJson(F_SITE, {});
      payload.version = (prev.version || 0) + 1;
      payload.updatedAt = new Date().toISOString();
      payload.updatedBy = s.login;
      writeJson(F_SITE, payload);
      return json(res, 200, { ok: true, version: payload.version, updatedAt: payload.updatedAt });
    } catch (e) {
      return json(res, 413, { error: 'Rubriques trop volumineuses: ' + e.message });
    }
  }

  // --- état de santé (supervision / maintenance)
  if (p === '/api/health') {
    return json(res, 200, {
      ok: true, version: 1, uptime: Math.round(process.uptime()),
      users: users.length, contentUpdatedAt: readJson(F_CONTENT, {}).updatedAt,
      backups: (function () { try { return fs.readdirSync(F_BACK).length; } catch (e) { return 0; } })()
    });
  }

  // --- site (le plus récent fichier HTML présent dans le dossier)
  if (req.method === 'GET' && (p === '/' || p.endsWith('.html'))) {
    const candidates = [SITE_FILE, path.join(ROOT, 'index.html'),
      path.join(ROOT, '..', 'index.html'), path.join(ROOT, 'public', 'index.html')];
    const file = candidates.find((f) => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } });
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Site introuvable : placez index.html à côté du dossier admin-server, ou définissez SITE_FILE.');
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    return fs.createReadStream(file).pipe(res);
  }

  json(res, 404, { error: 'Route inconnue.' });
});

server.listen(PORT, HOST, () => {
  console.log('TechnoLAB-ISTA · serveur de contenu partagé');
  console.log('  → http://localhost:' + PORT + '/#admin');
  console.log('  → données : ' + DATA_DIR);
  console.log('  → comptes : ' + F_USERS + ' (administrateur initial : admin / ' + (process.env.ADMIN_PASSWORD ? '••• (variable ADMIN_PASSWORD)' : BOOT_PASSWORD) + ')');
});
