#!/usr/bin/env node
// Hook script for Claude Code PermissionRequest events.
// Fires a needsAttention notification then exits 0 so normal permission flow continues.

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

  let message = input.tool_name || 'unknown tool';
  if (input.tool_input) {
    const detail =
      input.tool_input.command ||
      input.tool_input.url ||
      JSON.stringify(input.tool_input).slice(0, 80);
    if (detail) message += `: ${detail}`;
  }

  const request = {
    type: 'adapter-request',
    id: randomUUID(),
    method: 'tellCate',
    params: {
      tabId,
      type: 'cate.v1.needsAttention',
      body: {
        notificationType: 'permission_prompt',
        message,
      },
    },
  };

  const socket = createConnection(socketPath, () => {
    socket.end(JSON.stringify(request) + '\n');
  });
  socket.on('error', () => {});
});
