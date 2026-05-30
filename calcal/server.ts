/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const STORE_FILE_PATH = path.join(process.cwd(), 'data-store.json');

// Initialize default store if it doesn't exist
try {
  if (!fs.existsSync(STORE_FILE_PATH)) {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify({ goal: null, events: [] }, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Failed to initialize data-store.json', err);
}

// Helper to read data store
function readDataStore() {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const content = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading data-store.json', err);
  }
  return { goal: null, events: [] };
}

// Helper to write data store
function writeDataStore(data: any) {
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to data-store.json', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route: Get all app data (Goal & Events)
  app.get('/api/data', (req, res) => {
    const data = readDataStore();
    res.json(data);
  });

  // API Route: Update the single goal
  app.post('/api/goal', (req, res) => {
    const { title, targetMonth, targetDay, crossedDays } = req.body;
    const store = readDataStore();
    
    if (title === null || title === undefined || title.trim() === '') {
      store.goal = null;
    } else {
      store.goal = {
        title: title.trim(),
        targetMonth: Number(targetMonth) || 12,
        targetDay: Number(targetDay) || 29,
        createdAt: (store.goal && store.goal.title === title.trim()) ? store.goal.createdAt : Date.now(),
        crossedDays: Array.isArray(crossedDays) ? crossedDays : (store.goal?.crossedDays || [])
      };
    }
    
    writeDataStore(store);
    res.json({ success: true, goal: store.goal });
  });

  // API Route: Add an event
  app.post('/api/events', (req, res) => {
    const { dateKey, title, description, time } = req.body;
    if (!title || !dateKey) {
      return res.status(400).json({ error: 'Title and dateKey are required' });
    }

    const store = readDataStore();
    const newEvent = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      dateKey,
      title: title.trim(),
      description: (description || '').trim(),
      time: (time || '').trim(),
      createdAt: Date.now()
    };

    store.events.push(newEvent);
    writeDataStore(store);
    res.json({ success: true, event: newEvent });
  });

  // API Route: Delete an event
  app.delete('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const store = readDataStore();
    const initialLength = store.events.length;
    store.events = store.events.filter((e: any) => e.id !== id);

    if (store.events.length === initialLength) {
      return res.status(404).json({ error: 'Event not found' });
    }

    writeDataStore(store);
    res.json({ success: true });
  });

  // Serve Vite assets or compiled bundle
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
