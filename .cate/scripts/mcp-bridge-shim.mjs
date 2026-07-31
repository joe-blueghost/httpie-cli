#!/usr/bin/env node
// Stdio-to-HTTP bridge for MCP inside dev containers.
// Reads JSON-RPC messages from stdin, POSTs to the Cate HTTP bridge, writes responses to stdout.
// Env: CATE_BRIDGE_URL, CATE_BRIDGE_TOKEN, CATE_TAB_ID

import { createInterface } from 'node:readline';
import http from 'node:http';
import https from 'node:https';

const bridgeUrl = process.env.CATE_BRIDGE_URL;
const token = process.env.CATE_BRIDGE_TOKEN;
const tabId = process.env.CATE_TAB_ID;
const debug = process.env.CATE_BRIDGE_DEBUG === '1';

const log = (msg) => process.stderr.write(`mcp-bridge-shim: ${msg}\n`);

log(
  `startup — CATE_BRIDGE_URL=${bridgeUrl || '(unset)'} CATE_TAB_ID=${tabId || '(unset)'} token=${token ? '(set)' : '(unset)'} debug=${debug}`,
);

if (!bridgeUrl || !tabId) {
  log('FATAL: CATE_BRIDGE_URL and CATE_TAB_ID are required');
  process.exit(1);
}

const target = new URL(`${bridgeUrl}/mcp/${tabId}`);
log(`target URL: ${target.href}`);
const transport = target.protocol === 'https:' ? https : http;

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (!line.trim()) return;
  if (debug) log(`>> ${line.slice(0, 500)}`);
  const body = Buffer.from(line, 'utf-8');
  const req = transport.request(
    {
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
    (res) => {
      if (debug) log(`<< status=${res.statusCode}`);
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (debug) log(`<< ${data.slice(0, 500)}`);
        process.stdout.write(data + '\n');
      });
    },
  );
  req.on('error', (err) => {
    log(`request error: ${err.message}`);
  });
  req.end(body);
});

rl.on('close', () => process.exit(0));
