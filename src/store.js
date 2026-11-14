'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'state.json');

const REMOTE = {
  repo: process.env.GH_STATE_REPO || '',
  token: process.env.GH_STATE_TOKEN || '',
  branch: process.env.GH_STATE_BRANCH || '',
  file: process.env.GH_STATE_FILE || 'state.json',
};
const remote = Boolean(REMOTE.repo && REMOTE.token);

let db = { codes: {}, meta: {} };
let sha = null;
let timer = null;
let writing = false;

function readLocal() {
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeLocal() {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

async function flush() {
  if (!remote || writing) return;
  writing = true;
  try {
    const body = {
      message: `state ${new Date().toISOString()}`,
      content: Buffer.from(JSON.stringify(db, null, 2)).toString('base64'),
    };
    if (REMOTE.branch) body.branch = REMOTE.branch;
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${REMOTE.repo}/contents/${REMOTE.file}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${REMOTE.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'atemingo-bot',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      sha = json.content?.sha || sha;
    } else {
      console.error('[store] uzak yazma basarisiz:', res.status);
    }
  } catch (error) {
    console.error('[store] uzak yazma hatasi:', error.message);
  } finally {
    writing = false;
  }
}

async function load() {
  if (!remote) {
    db = { codes: {}, meta: {}, ...readLocal() };
    return;
  }
  const ref = REMOTE.branch ? `?ref=${REMOTE.branch}` : '';
  const url = `https://api.github.com/repos/${REMOTE.repo}/contents/${REMOTE.file}${ref}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${REMOTE.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'atemingo-bot',
      },
    });
    if (res.status === 404) {
      db = { codes: {}, meta: {} };
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    sha = json.sha;
    db = { codes: {}, meta: {}, ...JSON.parse(Buffer.from(json.content, 'base64').toString('utf8')) };
  } catch (error) {
    console.error('[store] uzak okuma hatasi:', error.message);
    db = { codes: {}, meta: {} };
  }
}

function save() {
  if (!remote) {
    try {
      writeLocal();
    } catch (error) {
      console.error('[store] yazma hatasi:', error.message);
    }
    return;
  }
  clearTimeout(timer);
  timer = setTimeout(flush, 1500);
}

const store = {
  load,
  save,
  remote,
  meta() {
    if (!db.meta || typeof db.meta !== 'object') db.meta = {};
    return db.meta;
  },
  async flush() {
    clearTimeout(timer);
    await flush();
  },
};

module.exports = store;
