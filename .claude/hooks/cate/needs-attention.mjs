#!/usr/bin/env node
// Hook script for Claude Code Notification events.
// Reads stdin JSON, writes a tellCate NDJSON request to the leftenant socket.
// Fire-and-forget — no response handling.

import { createConnection } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';

const tabId = process.env.TAB_ID;
const socketPath = process.env.LEFTENANT_SOCKET;
if (!tabId || !socketPath) process.exit(0);

const rl = createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  let input;
  try {
    input = JSON.parse(lines.join('\n'));
  } catch {
    process.exit(0);
  }

  const request = {
    type: 'adapter-request',
    id: randomUUID(),
    method: 'tellCate',
    params: {
      tabId,
      type: 'cate.v1.needsAttention',
      body: {
        notificationType: input.notification_type || '',
        message: input.message || '',
      },
    },
  };

  const socket = createConnection(socketPath, () => {
    socket.end(JSON.stringify(request) + '\n');
  });
  socket.on('error', () => {});
});
