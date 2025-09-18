#!/usr/bin/env node

import * as https from 'https';

function getEnv(name: string, fallback: string): string {
  const v = process.env[name];
  return (v === undefined || v === '') ? fallback : v;
}

const token = process.env.COPILOT_TOKEN || process.env.BEARER_TOKEN;
if (!token) {
  console.error('Missing COPILOT_TOKEN (or BEARER_TOKEN) environment variable.');
  process.exit(1);
}

const base = getEnv('COPILOT_BASE', 'https://substrate.office.com');
const topParam = encodeURIComponent(getEnv('TOP', '30'));
const settings = encodeURIComponent(getEnv('SETTINGS', 'true'));
const workspaceUsageTypes = encodeURIComponent(getEnv('WORKSPACE_USAGE_TYPES', 'Copilot,CopilotNotebook'));

const path = `/recommended/api/v1.1/loop/recent?top=${topParam}&settings=${settings}&workspaceUsageTypes=${workspaceUsageTypes}`;

const url = new URL(base + path);

const options: https.RequestOptions = {
  method: 'GET',
  hostname: url.hostname,
  path: url.pathname + url.search,
  headers: {
    'Authorization': `${token}`,
    'Accept': 'application/json',
    'User-Agent': 'WebClipperFetchScript/1.0'
  }
};

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || '');

type JwtDecoded = { header?: any; payload?: any; error?: string };

function safeDecodeSegment(seg: string): any {
  try {
    seg = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (seg.length % 4) seg += '=';
    const json = Buffer.from(seg, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    const err = e as Error;
    return { error: 'decode_failed', message: err && err.message };
  }
}

function decodeJwt(t: string): JwtDecoded {
  const parts = t.split('.');
  if (parts.length < 2) return { error: 'not_jwt' };
  return {
    header: safeDecodeSegment(parts[0]),
    payload: safeDecodeSegment(parts[1])
  };
}

function fetchJson(): Promise<any> {
  return new Promise((resolve, reject) => {
  const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const contentType = (res.headers['content-type'] || '') as string;
        if (DEBUG) {
          console.error('--- DEBUG RESPONSE META ---');
          console.error('Status:', res.statusCode);
            console.error('Headers:', JSON.stringify(res.headers, null, 2));
        }
        if (res.statusCode && res.statusCode >= 400) {
          if (DEBUG) {
            console.error('Raw body (first 1000 chars):');
            console.error(body.slice(0, 1000));
          }
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        try {
          const parsed = contentType.indexOf('application/json') !== -1 ? JSON.parse(body) : JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          const err = e as Error;
          reject(new Error('Failed to parse JSON: ' + (err && err.message) + '\nRaw body (first 500): ' + body.slice(0, 500)));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  if (DEBUG) {
    console.error('--- DEBUG REQUEST ---');
    console.error('URL:', base + path);
    console.error('Hostname:', options.hostname);
    console.error('Path:', options.path);
  console.error('Token (first 25 chars):', token.slice(0, 25) + '...');
  const normalizedToken = token.startsWith('Bearer ') ? token.substring(7) : token; // Only decode raw JWT part
  const decoded = decodeJwt(normalizedToken);
    if (!decoded.error) {
      const { header, payload } = decoded;
      console.error('JWT header:', header);
      if (payload) {
        const subset: Record<string, any> = {};
        ['aud','iss','exp','nbf','iat','scp','roles','appid','tid','oid','sub','xms_acf_fct','xms_acu','xms_ftd'].forEach(k => {
          if ((payload as any)[k] !== undefined) subset[k] = (payload as any)[k];
        });
        console.error('JWT payload subset:', subset);
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          console.error('Token expires (local):', expDate.toString());
        }
      }
    } else {
      console.error('JWT decode error:', decoded);
    }
  }
  let json: any = '';
  try {
    json = await fetchJson();
    console.log(json);
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    const e = err as any;
    console.error('Error fetching notebooks:', e && e.message);
    console.log(e);
    if (!DEBUG) {
      console.error('Re-run with DEBUG=1 for more details.');
    }
    process.exitCode = 1;
  }
})();
