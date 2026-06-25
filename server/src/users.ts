import type { Express } from 'express';
import {
  appendLog,
  defaultUser,
  deleteUser,
  readUser,
  writeUser,
  type UserDoc,
} from './store.js';

export function registerUserRoutes(app: Express): void {
  app.post('/users/bootstrap', async (req, res) => {
    const { deviceId, displayName } = req.body ?? {};
    if (!deviceId || typeof deviceId !== 'string') {
      res.status(400).json({ error: 'deviceId required' });
      return;
    }
    let doc = await readUser(deviceId);
    if (!doc) {
      doc = defaultUser(deviceId, displayName);
      await writeUser(deviceId, doc);
    } else if (displayName && doc.displayName !== displayName) {
      doc.displayName = displayName;
      doc.updatedAt = new Date().toISOString();
      await writeUser(deviceId, doc);
    }
    const { state: _s, ...profile } = doc;
    res.json(profile);
  });

  app.get('/users/:deviceId', async (req, res) => {
    const doc = await readUser(req.params.deviceId);
    if (!doc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { state: _s, ...profile } = doc;
    res.json(profile);
  });

  app.patch('/users/:deviceId', async (req, res) => {
    const doc = await readUser(req.params.deviceId);
    if (!doc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { displayName, email, phone, permissions } = req.body ?? {};
    if (displayName !== undefined) doc.displayName = String(displayName);
    if (email !== undefined) doc.email = email;
    if (phone !== undefined) doc.phone = phone ? String(phone).replace(/\D/g, '') : null;
    if (permissions && typeof permissions === 'object') {
      doc.permissions = { ...doc.permissions, ...permissions };
    }
    doc.updatedAt = new Date().toISOString();
    await writeUser(req.params.deviceId, doc);
    const { state: _s, ...profile } = doc;
    res.json(profile);
  });

  app.get('/users/:deviceId/state', async (req, res) => {
    const doc = await readUser(req.params.deviceId);
    if (!doc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(doc.state);
  });

  app.put('/users/:deviceId/state', async (req, res) => {
    const doc = await readUser(req.params.deviceId);
    if (!doc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    doc.state = { ...doc.state, ...req.body };
    doc.updatedAt = new Date().toISOString();
    await writeUser(req.params.deviceId, doc);
    res.json({ saved: true });
  });

  app.delete('/users/:deviceId', async (req, res) => {
    const ok = await deleteUser(req.params.deviceId);
    if (!ok) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await appendLog({
      type: 'account_deleted',
      deviceId: req.params.deviceId,
      at: new Date().toISOString(),
    });
    res.json({ deleted: true });
  });

  app.post('/users/log', async (req, res) => {
    const { deviceId, event, meta, at } = req.body ?? {};
    await appendLog({ deviceId, event, meta, at: at ?? new Date().toISOString() });
    res.json({ ok: true });
  });
}
