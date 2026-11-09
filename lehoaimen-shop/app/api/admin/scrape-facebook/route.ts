import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { POST_CATEGORIES, type PostCategory } from '@/lib/posts';
import { getPublicSiteUrl } from '@/lib/site';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LINKS = 8;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_POST_IMAGES = 30;
const MAX_IMAGE_CANDIDATES = 120;
const MAX_SAVED_IMAGE_BYTES = 48 * 1024 * 1024;
const PAGE_HOSTS = new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com', 'mbasic.facebook.com', 'web.facebook.com', 'fb.watch', 'www.fb.watch']);

function isFacebookPageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && PAGE_HOSTS.has(url.hostname.toLowerCase()) && url.pathname.length > 1;
  } catch { return false; }
}

function isFacebookMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const trusted = host === 'facebook.com' || host.endsWith('.facebook.com') || host.endsWith('.fbcdn.net') || host.endsWith('.fbsbx.com');
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && trusted;
  } catch { return false; }
}

function isFacebookImageUrl(value: unknown): value is string {
  if (!isFacebookMediaUrl(value)) return false;
  const url = new URL(value);
  const trustedHost = url.hostname.toLowerCase().endsWith('.fbcdn.net') || url.hostname.toLowerCase().endsWith('.fbsbx.com');
  return trustedHost && /\.(?:jpe?g|png|webp)$/i.test(url.pathname);
}

function getPostId(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    const pathId = url.pathname.match(/\/(?:posts|videos|photos|reel)\/([\da-z]+)/i)?.[1]
      || url.pathname.match(/\/share\/(?:p|v)\/([\da-z]+)/i)?.[1];
    return pathId || url.searchParams.get('story_fbid') || url.searchParams.get('fbid') || '';
  } catch { return ''; }
}

function decodeHtml(value: string) {
  return value.replace(/&#(x[\da-f]+|\d+);?/gi, (_, code: string) => {
    const point = code[0]?.toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : parseInt(code, 10);
    return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
  }).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function tagAttributes(tag: string) {
  const attrs = new Map<string, string>();
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function readMetaAll(html: string, keys: string[]) {
  const values: string[] = [];
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = tagAttributes(tag);
    if (keys.some(key => (attrs.get('property') || attrs.get('name') || '').toLowerCase() === key.toLowerCase())) {
      const value = decodeHtml(attrs.get('content') || '').trim();
      if (value) values.push(value);
    }
  }
  return [...new Set(values)];
}

function htmlToCaption(value: string) {
  return decodeHtml(value
    .replace(/<(?:br)\b[^>]*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|li|blockquote|section)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/\r\n?/g, '\n')
    .replace(/[\t \u00a0]+\n/g, '\n')
    .replace(/\n[\t \u00a0]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractStoryBlocks(html: string, postId: string) {
  const blocks: Array<{ html: string; score: number }> = [];
  const stack: Array<{ tag: string; start: number; score: number }> = [];
  const tags = /<!--(?:[\s\S]*?)-->|<\/?[a-z][\w:-]*\b[^>]*>/gi;
  for (const match of html.matchAll(tags)) {
    const token = match[0];
    if (token.startsWith('<!--')) continue;
    const name = token.match(/^<\/?([a-z][\w:-]*)/i)?.[1]?.toLowerCase();
    if (!name) continue;
    if (token.startsWith('</')) {
      let index = stack.length - 1;
      while (index >= 0 && stack[index].tag !== name) index -= 1;
      if (index < 0) continue;
      const opened = stack[index];
      if (opened.score > 0) {
        const blockHtml = html.slice(opened.start, match.index);
        blocks.push({ html: blockHtml, score: opened.score });
      }
      stack.length = index;
      continue;
    }
    const attrs = tagAttributes(token);
    const pagelet = attrs.get('data-pagelet') || '';
    const dataFt = decodeHtml(attrs.get('data-ft') || '');
    const identifiers = `${token} ${dataFt} ${attrs.get('id') || ''} ${attrs.get('data-testid') || ''}`;
    let score = 0;
    if (postId && identifiers.includes(postId)) score = 100;
    else if (/top_level_post_id|mf_story_key|story_fbid/i.test(dataFt)) score = 80;
    else if (/feedunit|permalink.*(?:post|story)|story.*(?:post|unit)/i.test(pagelet)) score = 60;
    else if (attrs.get('role') === 'article') score = 30;
    const voidElement = /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(name);
    if (!voidElement && !/\/\s*>$/.test(token)) stack.push({ tag: name, start: match.index, score });
  }
  const exact = blocks.filter(block => block.score >= 100).sort((a, b) => a.html.length - b.html.length);
  if (exact.length) return exact[0].html;
  const storyBlocks = blocks.filter(block => block.score >= 60).sort((a, b) => b.score - a.score || a.html.length - b.html.length);
  if (storyBlocks.length) return storyBlocks[0].html;
  const articleBlocks = blocks.filter(block => block.score >= 30).sort((a, b) => a.html.length - b.html.length);
  return articleBlocks[0]?.html || '';
}

function getPostScopedScripts(html: string, postId: string) {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  if (!postId) return [];
  return scripts.filter(script => script.includes(postId) && /playable_url|browser_native_(?:sd|hd)_url|videoData|image/i.test(script)).slice(0, 6);
}

function extractDeepJsonMedia(html: string, postId: string) {
  const scripts = getPostScopedScripts(html, postId);
  const images: string[] = [];
  const videos: string[] = [];
  const videoKeys = /"(?:browser_native_(?:sd|hd)_url|playable_url(?:_quality_hd)?|video_url|browser_native_adaptive_url)"\s*:\s*"((?:\\.|[^"\\])+)"/gi;
  const imageKeys = /"(?:large_share_image|photo_image|image|uri)"\s*:\s*"((?:\\.|[^"\\])+)"/gi;
  for (const script of scripts) {
    for (const match of script.matchAll(videoKeys)) {
      try { videos.push(JSON.parse(`"${match[1]}"`)); } catch { /* Ignore partial escaped JSON values. */ }
    }
    for (const match of script.matchAll(imageKeys)) {
      try { images.push(JSON.parse(`"${match[1]}"`)); } catch { /* Ignore partial escaped JSON values. */ }
    }
    for (const match of normalizeEmbedded(script).matchAll(/https:\/\/[^"'<>\s\\]+/g)) {
      const url = match[0].replace(/[),.;\]}]+$/, '');
      if (/\.mp4(?:[?#]|$)|\.m3u8(?:[?#]|$)/i.test(url)) videos.push(url);
      else if (isFacebookImageUrl(url)) images.push(url);
    }
  }
  return { images, videos };
}

function normalizeEmbedded(value: string) {
  return decodeHtml(value.replace(/\\u0026/gi, '&').replace(/\\u003d/gi, '=').replace(/\\u003a/gi, ':').replace(/\\\//g, '/'));
}

function readEmbeddedJson(script: string) {
  const values: unknown[] = [];
  let attempts = 0;
  for (let start = script.indexOf('{'); start >= 0 && attempts < 100;) {
    attempts += 1;
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < script.length; index += 1) {
      const char = script[index];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quoted = false;
        continue;
      }
      if (char === '"') quoted = true;
      else if (char === '{') depth += 1;
      else if (char === '}' && --depth === 0) {
        try {
          values.push(JSON.parse(script.slice(start, index + 1)));
          start = script.indexOf('{', index + 1);
        } catch { start = script.indexOf('{', start + 1); }
        break;
      }
    }
    if (start >= 0 && depth !== 0) start = script.indexOf('{', start + 1);
  }
  return values;
}

function extractGraphPostData(html: string, postId: string) {
  const captions: string[] = [];
  const images: string[] = [];
  const videos: string[] = [];
  const videoThumbnails = new Set<string>();
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(script => !postId || script.includes(postId));
  const visit = (value: unknown, path: string[], attachmentContext = false, videoContext = false) => {
    if (typeof value === 'string') return;
    if (Array.isArray(value)) { value.forEach(item => visit(item, path, attachmentContext, videoContext)); return; }
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    const hasVideo = keys.some(key => /^(?:playable_url(?:_quality_hd)?|browser_native_(?:sd|hd)_url)$/i.test(key)) || /video/i.test(String(record.__typename || record.type || ''));
    const inVideo = videoContext || hasVideo;
    const inAttachment = attachmentContext || path.some(key => /^(?:attachments?|subattachments?|all_subattachments)$/i.test(key));
    for (const [key, child] of Object.entries(record)) {
      const nextPath = [...path, key];
      if (typeof child === 'string') {
        if (/^(?:text|message)$/i.test(key) && (path.some(part => /message|story|unified_stories/i.test(part)) || /(?:message|story|unified_stories)/i.test(nextPath.join('.')))) {
          const text = normalizeEmbedded(child);
          if (text.trim()) captions.push(text);
        }
        if (/^(?:playable_url(?:_quality_hd)?|browser_native_(?:sd|hd)_url)$/i.test(key)) videos.push(normalizeEmbedded(child));
        if (inAttachment && /(?:uri|url|src)$/i.test(key) && isFacebookImageUrl(normalizeEmbedded(child))) {
          if (inVideo || /poster|preview_image|thumbnail/i.test(nextPath.join('.'))) videoThumbnails.add(normalizeEmbedded(child));
          else images.push(normalizeEmbedded(child));
        }
        continue;
      }
      visit(child, nextPath, inAttachment, inVideo);
    }
  };
  for (const script of scripts) for (const value of readEmbeddedJson(script)) visit(value, [], false, false);
  return { captions, images, videos, videoThumbnails };
}

function collectJsonLd(html: string) {
  const text: string[] = [];
  const images: string[] = [];
  const videos: string[] = [];
  const visit = (value: unknown, key = '') => {
    if (typeof value === 'string') {
      if (/^(articleBody|caption|description|text|headline|name)$/i.test(key) && value.length >= 12) text.push(value);
      if (/^(image|thumbnailUrl|contentUrl|embedUrl)$/i.test(key)) {
        if (/image|thumbnail/i.test(key)) images.push(value); else videos.push(value);
      }
      return;
    }
    if (Array.isArray(value)) { value.forEach(item => visit(item, key)); return; }
    if (value && typeof value === 'object') Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
  };
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try { visit(JSON.parse(match[1])); } catch { /* Ignore malformed structured data and continue with public HTML metadata. */ }
  }
  return { text, images, videos };
}

function extractPublicPost(html: string, postId: string) {
  const storyHtml = extractStoryBlocks(html, postId);
  const structured = collectJsonLd(html);
  const deepJson = extractDeepJsonMedia(html, postId);
  const graph = extractGraphPostData(html, postId);
  const captions = [...graph.captions];

  // Facebook's share metadata is often shortened. Read the rendered message node inside
  // the selected story as well; retain <br> and paragraph boundaries as literal newlines.
  for (const match of (storyHtml || '').matchAll(/<(?:div|span)\b([^>]*)>([\s\S]*?)<\/(?:div|span)>/gi)) {
    const attrs = match[1];
    if (!/(?:data-ad-preview\s*=\s*["']message["']|data-testid\s*=\s*["'][^"']*message|dir\s*=\s*["']auto["'])/i.test(attrs)) continue;
    const text = htmlToCaption(match[2]);
    if (text.length >= 12) captions.push(text);
  }
  const content = [...new Set(captions)].sort((left, right) => right.length - left.length)[0] || '';
  const title = readMetaAll(html, ['og:title', 'twitter:title']).find(Boolean) || structured.text.find(value => value.length < 180) || '';

  const metaImages = readMetaAll(html, ['og:image', 'og:image:url', 'twitter:image']);
  const hasVideoMarkup = graph.videos.length > 0 || /<video\b|<source\b[^>]*video|playable_url|browser_native_(?:sd|hd)_url/i.test(storyHtml)
    || deepJson.videos.some(url => /\.mp4(?:[?#]|$)/i.test(normalizeEmbedded(url)))
    || readMetaAll(html, ['og:video:secure_url', 'og:video:url', 'og:video', 'twitter:player:stream']).length > 0;
  const metaWidth = Number(readMetaAll(html, ['og:image:width'])[0] || 0);
  const metaHeight = Number(readMetaAll(html, ['og:image:height'])[0] || 0);
  const imageCandidates: Array<{ url: string; width: number; height: number; linkedToPost: boolean }> = [
    // Share images on video posts are usually generated video frames. Real attached
    // photos remain available as story-scoped <img> elements below.
    ...(!hasVideoMarkup ? metaImages : []).map(url => ({ url, width: metaWidth, height: metaHeight, linkedToPost: Boolean(postId && url.includes(postId)) })),
    ...graph.images.map(url => ({ url, width: 0, height: 0, linkedToPost: Boolean(postId && url.includes(postId)) })),
    ...(!hasVideoMarkup ? structured.images : []).map(url => ({ url, width: 0, height: 0, linkedToPost: Boolean(postId && url.includes(postId)) })),
    ...(!hasVideoMarkup ? deepJson.images : []).map(url => ({ url: normalizeEmbedded(url), width: 0, height: 0, linkedToPost: Boolean(postId && url.includes(postId)) })),
  ];
  const tags = storyHtml.match(/<img\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = tagAttributes(tag);
    const width = Number(attrs.get('width') || 0);
    const height = Number(attrs.get('height') || 0);
    if ((width && width <= 500) || (height && height <= 500)) continue;
    for (const key of ['src', 'data-src', 'data-original', 'srcset', 'data-srcset']) {
      const raw = attrs.get(key);
      if (!raw) continue;
      const candidates = key.includes('srcset') ? raw.split(',').map(item => item.trim().split(/\s+/)[0]) : [raw];
      imageCandidates.push(...candidates.map(normalizeEmbedded).map(url => ({ url, width, height, linkedToPost: Boolean(postId && url.includes(postId)) })));
    }
  }

  // Restrict embedded album URLs to the one selected story; never scan the full page for media.
  const unescapedHtml = normalizeEmbedded(storyHtml || '');
  for (const match of unescapedHtml.matchAll(/https:\/\/[^"'<>\s\\]+/g)) {
    const candidate = match[0].replace(/[),.;\]}]+$/, '');
    if (isFacebookImageUrl(candidate)) imageCandidates.push({ url: candidate, width: 0, height: 0, linkedToPost: Boolean(postId && candidate.includes(postId)) });
  }
  const uniqueImages = new Map<string, { url: string; width: number; height: number; linkedToPost: boolean }>();
  for (const candidate of imageCandidates) {
    const url = normalizeEmbedded(candidate.url);
    if (isFacebookImageUrl(url) && !/_video_|poster|preview_image/i.test(url) && !graph.videoThumbnails.has(url) && !uniqueImages.has(url)) uniqueImages.set(url, { ...candidate, url });
  }
  const candidates = [...uniqueImages.values()]
    .sort((a, b) => (b.width * b.height) - (a.width * a.height) || Number(b.linkedToPost) - Number(a.linkedToPost))
    .slice(0, MAX_IMAGE_CANDIDATES);

  const videoMetadataCandidates = [
    ...readMetaAll(html, ['og:video:secure_url', 'og:video:url', 'og:video', 'twitter:player:stream']),
    ...structured.videos,
    ...deepJson.videos,
    ...graph.videos,
  ];
  const videoSourceCandidates: string[] = [];
  for (const tag of storyHtml.match(/<(?:video|source)\b[^>]*>/gi) || []) {
    const attrs = tagAttributes(tag);
    if (attrs.has('src')) videoSourceCandidates.push(normalizeEmbedded(attrs.get('src') || ''));
    if (attrs.has('data-src')) videoSourceCandidates.push(normalizeEmbedded(attrs.get('data-src') || ''));
  }
  const directVideoCandidates = [...unescapedHtml.matchAll(/https:\/\/[^"'<>\s\\]*(?:\.mp4|\.m3u8)(?:\?[^"'<>\s\\]*)?/gi)].map(match => match[0].replace(/[),.;\]}]+$/, ''));
  const normalizedVideoSources = [...new Set([...videoSourceCandidates, ...directVideoCandidates, ...videoMetadataCandidates].map(normalizeEmbedded))];
  const videoUrl = normalizedVideoSources.find(url => isFacebookMediaUrl(url) && /\.mp4(?:[?#]|$)/i.test(url))
    || null;

  return { title: normalizeEmbedded(title).slice(0, 160), content, imageCandidates: candidates, videoUrl };
}

function getAlternateRendererUrl(source: string, finalUrl?: string) {
  try {
    const url = new URL(finalUrl || source);
    if (url.hostname === 'www.facebook.com' || url.hostname === 'facebook.com') url.hostname = 'mbasic.facebook.com';
    else if (url.hostname === 'mbasic.facebook.com') url.hostname = 'm.facebook.com';
    else return null;
    return url.toString() === (finalUrl || source) ? null : url.toString();
  } catch { return null; }
}

async function scrapePublicUrl(url: string) {
  const { bytes, finalUrl } = await fetchBounded(url, 'html');
  const html = bytes.toString('utf8');
  const postId = getPostId(finalUrl) || getPostId(url);
  const extracted = extractPublicPost(html, postId);
  const validated = await validatePostImages(extracted.imageCandidates);
  return { ...extracted, ...validated, html, finalUrl };
}

async function readRequestJson(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Thiếu dữ liệu yêu cầu.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new Error('Dữ liệu yêu cầu quá lớn.');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as { action?: string; urls?: unknown; post?: Record<string, unknown> };
}

async function fetchBounded(url: string, kind: 'html' | 'image') {
  let current = url;
  for (let hop = 0; hop <= 3; hop += 1) {
    if (kind === 'html' ? !isFacebookPageUrl(current) : !isFacebookMediaUrl(current)) throw new Error('Liên kết chuyển hướng không thuộc Facebook hoặc CDN ảnh được phép.');
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeHoaiMenShop/1.0; +https://facebook.com)', Accept: kind === 'html' ? 'text/html,application/xhtml+xml' : 'image/jpeg,image/png,image/webp' },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || hop === 3) throw new Error('Bài viết chuyển hướng quá nhiều lần.');
      current = new URL(location, current).toString();
      continue;
    }
    if (!response.ok) throw new Error(`Facebook trả về HTTP ${response.status}.`);
    if (kind === 'html' && !response.headers.get('content-type')?.toLowerCase().includes('text/html')) throw new Error('Facebook không trả về trang HTML công khai.');
    const maxBytes = kind === 'html' ? MAX_HTML_BYTES : MAX_IMAGE_BYTES;
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new Error('Nội dung từ Facebook vượt giới hạn dung lượng.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Không đọc được phản hồi từ Facebook.');
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); throw new Error('Nội dung từ Facebook vượt giới hạn dung lượng.'); }
      chunks.push(value);
    }
    return { bytes: Buffer.concat(chunks), contentType: response.headers.get('content-type') || '', finalUrl: current };
  }
  throw new Error('Không thể tải nội dung Facebook.');
}

function getImageType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: '.jpg', mime: 'image/jpeg' };
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { ext: '.png', mime: 'image/png' };
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', mime: 'image/webp' };
  return null;
}

function getImageDimensions(bytes: Buffer, type: { ext: string } | null) {
  if (type?.ext === '.png' && bytes.length >= 24) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (type?.ext === '.jpg') {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const segmentLength = bytes.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
      }
      offset += segmentLength;
    }
  }
  if (type?.ext === '.webp' && bytes.length >= 30 && bytes.toString('ascii', 12, 16) === 'VP8X') {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }
  if (type?.ext === '.webp' && bytes.length >= 30 && bytes.toString('ascii', 12, 16) === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (type?.ext === '.webp' && bytes.length >= 25 && bytes.toString('ascii', 12, 16) === 'VP8L' && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    };
  }
  return null;
}

async function validatePostImages(candidates: Array<{ url: string; width: number; height: number; linkedToPost: boolean }>) {
  const accepted: string[] = [];
  const unique = [...new Map(candidates.map(candidate => [candidate.url, candidate])).values()];
  for (let start = 0; start < unique.length; start += 3) {
    const checked = await Promise.all(unique.slice(start, start + 3).map(async candidate => {
      if (candidate.linkedToPost) return candidate.url;
      try {
        const { bytes, contentType } = await fetchBounded(candidate.url, 'image');
        const type = getImageType(bytes);
        if (!type || (contentType && !contentType.toLowerCase().startsWith(type.ext === '.jpg' ? 'image/jpeg' : `image/${type.ext.slice(1)}`))) return null;
        const dimensions = getImageDimensions(bytes, type);
        return dimensions && dimensions.width > 500 && dimensions.height > 500 ? candidate.url : null;
      } catch { return null; }
    }));
    accepted.push(...checked.filter((url): url is string => Boolean(url)));
  }
  return { images: [...new Set(accepted)].slice(0, MAX_POST_IMAGES), imagesTruncated: accepted.length > MAX_POST_IMAGES };
}

function verifyRequest(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  const origin = request.headers.get('origin');
  const allowed = new Set([request.nextUrl.origin, getPublicSiteUrl()].filter((value): value is string => Boolean(value)));
  if (!origin || !allowed.has(origin)) return NextResponse.json({ error: 'Nguồn gửi yêu cầu không hợp lệ.' }, { status: 403 });
  return null;
}

export async function POST(request: NextRequest) {
  const denied = verifyRequest(request);
  if (denied) return denied;
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_REQUEST_BYTES) return NextResponse.json({ error: 'Dữ liệu yêu cầu quá lớn.' }, { status: 413 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return NextResponse.json({ error: 'Yêu cầu phải có định dạng JSON.' }, { status: 415 });
  try {
    const body = await readRequestJson(request);
    if (body.action === 'publish') return await publishPost(body.post);
    if (!Array.isArray(body.urls) || body.urls.length < 1 || body.urls.length > MAX_LINKS) {
      return NextResponse.json({ error: `Gửi từ 1 đến ${MAX_LINKS} đường dẫn mỗi lần.` }, { status: 400 });
    }
    const results = await Promise.all(body.urls.map(async raw => {
      if (!isFacebookPageUrl(raw)) return { sourceUrl: String(raw).slice(0, 2048), ok: false, error: 'Chỉ hỗ trợ link bài viết Facebook HTTPS công khai hợp lệ.' };
      try {
        let scraped = await scrapePublicUrl(raw);
        const alternateUrl = (scraped.images.length < 2 || !scraped.videoUrl) ? getAlternateRendererUrl(raw, scraped.finalUrl) : null;
        if (alternateUrl) {
          console.warn('Facebook public scrape returned incomplete media; retrying one alternate renderer.', {
            host: new URL(alternateUrl).hostname,
            imageCount: scraped.images.length,
            hasVideo: Boolean(scraped.videoUrl),
          });
          try {
            const alternate = await scrapePublicUrl(alternateUrl);
            const mergedImages = [...new Set([...scraped.images, ...alternate.images])].slice(0, MAX_POST_IMAGES);
            const best = alternate.images.length > scraped.images.length ? alternate : scraped;
            scraped = {
              ...best,
              images: mergedImages,
              imagesTruncated: scraped.imagesTruncated || alternate.imagesTruncated || mergedImages.length === MAX_POST_IMAGES,
              videoUrl: scraped.videoUrl || alternate.videoUrl,
              title: scraped.title || alternate.title,
              content: scraped.content.length >= alternate.content.length ? scraped.content : alternate.content,
            };
          } catch (retryError) {
            console.warn('Facebook alternate public renderer retry failed.', {
              message: retryError instanceof Error ? retryError.message : 'Unknown error',
            });
          }
        }
        const { title, content, images, imagesTruncated, videoUrl, html } = scraped;
        if ((!title && !content) || /login|checkpoint|content isn't available|this content isn't available/i.test(html.slice(0, 500_000)) && !content) {
          throw new Error('Bài viết không công khai hoặc Facebook yêu cầu đăng nhập; không lấy được metadata.');
        }
        if (!images.length && !videoUrl) throw new Error('Facebook không cung cấp ảnh hoặc video xem trước công khai cho link này.');
        return { sourceUrl: raw, ok: true, title: title || 'Bài viết Facebook', content, images, imagesTruncated, videoUrl };
      } catch (error) {
        return { sourceUrl: raw, ok: false, error: error instanceof Error ? error.message : 'Không đọc được bài viết công khai.' };
      }
    }));
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Facebook scrape request failed:', error);
    if (error instanceof Error && error.message === 'Dữ liệu yêu cầu quá lớn.') return NextResponse.json({ error: error.message }, { status: 413 });
    return NextResponse.json({ error: 'Không thể xử lý yêu cầu cào bài viết.' }, { status: 400 });
  }
}

async function publishPost(value: unknown) {
  if (!value || typeof value !== 'object') return NextResponse.json({ error: 'Thiếu dữ liệu bài viết.' }, { status: 400 });
  const post = value as Record<string, unknown>;
  const sourceUrl = post.sourceUrl;
  const title = typeof post.title === 'string' ? post.title.trim() : '';
  const content = typeof post.content === 'string' ? post.content : '';
  const category = post.category as PostCategory;
  const images = Array.isArray(post.images) ? post.images : [];
  const videoUrl = post.videoUrl === '' || post.videoUrl == null ? null : post.videoUrl;
  if (!isFacebookPageUrl(sourceUrl)) return NextResponse.json({ error: 'Link nguồn Facebook không hợp lệ.' }, { status: 400 });
  if (title.trim().length < 5 || title.length > 160 || !content.trim()) return NextResponse.json({ error: 'Tiêu đề hoặc nội dung bài viết không hợp lệ.' }, { status: 400 });
  if (!POST_CATEGORIES.some(item => item.slug === category)) return NextResponse.json({ error: 'Danh mục không hợp lệ.' }, { status: 400 });
  if (images.length > MAX_POST_IMAGES || !images.every(isFacebookImageUrl) || (!images.length && !videoUrl)) return NextResponse.json({ error: 'Danh sách ảnh/video không hợp lệ.' }, { status: 400 });
  if (videoUrl !== null && !isFacebookMediaUrl(videoUrl)) return NextResponse.json({ error: 'Link video không hợp lệ.' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT slug FROM posts WHERE source_url = ?').get(sourceUrl) as { slug: string } | undefined;
  if (existing) return NextResponse.json({ success: true, duplicate: true, slug: existing.slug });
  const savedFiles: string[] = [];
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posts');
    await mkdir(uploadDir, { recursive: true });
    const localImages: string[] = [];
    let totalBytes = 0;
    for (let start = 0; start < images.length; start += 3) {
      const batch = await Promise.all(images.slice(start, start + 3).map(async imageUrl => {
        const { bytes, contentType } = await fetchBounded(imageUrl, 'image');
        const type = getImageType(bytes);
        if (!type || (contentType && !contentType.toLowerCase().startsWith(type.mime))) throw new Error('Ảnh từ Facebook không phải JPEG, PNG hoặc WebP hợp lệ.');
        return { bytes, type };
      }));
      for (const { bytes, type } of batch) {
        totalBytes += bytes.byteLength;
        if (totalBytes > MAX_SAVED_IMAGE_BYTES) throw new Error('Tổng dung lượng ảnh vượt quá 48 MB.');
        const filename = `${randomUUID()}${type.ext}`;
        const target = path.join(uploadDir, filename);
        await writeFile(target, bytes, { flag: 'wx' });
        savedFiles.push(target);
        localImages.push(`/uploads/posts/${filename}`);
      }
    }
    const slug = `${slugify(title) || 'bai-viet-facebook'}-${randomUUID().slice(0, 8)}`;
    const result = db.prepare(`INSERT INTO posts (title, slug, content, category, images, source_url, video_url, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)`)
      .run(title, slug, content, category, JSON.stringify(localImages), sourceUrl, videoUrl);
    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid), slug }, { status: 201 });
  } catch (error) {
    await Promise.all(savedFiles.map(file => unlink(file).catch(() => undefined)));
    if (error instanceof Error && (error.message.includes('Tổng dung lượng') || error.message.includes('Ảnh từ Facebook'))) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Publish scraped Facebook post failed:', error);
    return NextResponse.json({ error: 'Không thể lưu bài viết lúc này.' }, { status: 502 });
  }
}
