import { readFile } from 'node:fs/promises';

const benchmarkUrl = 'https://www.facebook.com/share/p/1F8j6zRfFi/';
const env = { ...process.env };

try {
  const source = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(ADMIN_USERNAME|ADMIN_PASSWORD)\s*=\s*(.*)\s*$/);
    if (!match || env[match[1]]) continue;
    const raw = match[2];
    env[match[1]] = raw.startsWith('"') && raw.endsWith('"')
      ? raw.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"')
      : raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1) : raw.replace(/\s+#.*$/, '').trim();
  }
} catch {
  // Environment variables may be provided by the shell or deployment environment.
}

const baseUrl = (env.SCRAPER_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
  console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD in the environment or .env.local.');
  process.exit(2);
}

try {
  const login = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Admin login failed with HTTP ${login.status}.`);

  const setCookies = typeof login.headers.getSetCookie === 'function' ? login.headers.getSetCookie() : [login.headers.get('set-cookie') || ''];
  const cookie = setCookies.find(value => value.startsWith('admin_token='))?.slice('admin_token='.length).split(';', 1)[0];
  if (!cookie) throw new Error('Login succeeded but the admin session cookie was not returned.');

  const response = await fetch(`${baseUrl}/api/admin/scrape-facebook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl,
      Cookie: `admin_token=${cookie}`,
    },
    body: JSON.stringify({ urls: [benchmarkUrl] }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Scrape API failed with HTTP ${response.status}: ${payload.error || 'Unknown API error'}`);

  const result = payload.results?.[0];
  const content = typeof result?.content === 'string' ? result.content : '';
  const images = Array.isArray(result?.images) ? result.images : [];
  const imagePass = images.length > 0;
  const captionPass = content.length > 300 && !content.includes('...') && !content.includes('…');
  const videoPass = typeof result?.videoUrl === 'string' && /\.mp4(?:[?#]|$)/i.test(result.videoUrl);
  const report = { success: Boolean(result?.ok && captionPass && imagePass && videoPass), ok: Boolean(result?.ok), captionLength: content.length, captionPass, imageCount: images.length, imagePass, videoMp4: videoPass, videoPass, error: result?.error || null };
  console.log(JSON.stringify(report, null, 2));
  if (!report.success) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Scraper benchmark failed.');
  process.exitCode = 1;
}
