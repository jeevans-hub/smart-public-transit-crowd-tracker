import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import type { GtfsCsvRow, GtfsStaticFiles } from '../../../types/gtfs';

const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;
const DEFAULT_MAX_UNCOMPRESSED_BYTES = 300 * 1024 * 1024;
const REQUIRED_FILES = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt'] as const;
const SUPPORTED_FILES = new Set([
  ...REQUIRED_FILES,
  'agency.txt',
  'calendar.txt',
  'calendar_dates.txt',
  'shapes.txt',
]);

export interface GtfsStaticLoadOptions {
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
}

function assertHttpUrl(value: string): URL {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('GTFS static URL must use HTTP or HTTPS');
  }
  return parsed;
}

export function parseGtfsCsv(text: string): GtfsCsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index]?.trim() ?? '']),
  ));
}

function findZipEntry(entries: Record<string, Uint8Array>, fileName: string): Uint8Array | undefined {
  const normalized = fileName.toLowerCase();
  const key = Object.keys(entries).find((entry) => entry.replace(/\\/g, '/').split('/').at(-1)?.toLowerCase() === normalized);
  return key ? entries[key] : undefined;
}

function readCsvEntry(entries: Record<string, Uint8Array>, fileName: string, required = false): GtfsCsvRow[] {
  const entry = findZipEntry(entries, fileName);
  if (!entry) {
    if (required) throw new Error(`GTFS archive is missing ${fileName}`);
    return [];
  }
  return parseGtfsCsv(strFromU8(entry));
}

export function parseGtfsStaticZip(bytes: Uint8Array): GtfsStaticFiles {
  let entries: Record<string, Uint8Array>;
  try {
    let uncompressedBytes = 0;
    entries = unzipSync(bytes, {
      filter: (file) => {
        const fileName = file.name.replace(/\\/g, '/').split('/').at(-1)?.toLowerCase() || '';
        if (!SUPPORTED_FILES.has(fileName)) return false;
        uncompressedBytes += file.originalSize;
        if (uncompressedBytes > DEFAULT_MAX_UNCOMPRESSED_BYTES) {
          throw new Error(`GTFS archive exceeds ${DEFAULT_MAX_UNCOMPRESSED_BYTES} uncompressed bytes`);
        }
        return true;
      },
    });
  } catch (error) {
    throw new Error(`Invalid GTFS ZIP archive: ${error instanceof Error ? error.message : 'unable to unzip'}`);
  }
  return {
    agency: readCsvEntry(entries, 'agency.txt'),
    stops: readCsvEntry(entries, 'stops.txt', true),
    routes: readCsvEntry(entries, 'routes.txt', true),
    trips: readCsvEntry(entries, 'trips.txt', true),
    stopTimes: readCsvEntry(entries, 'stop_times.txt', true),
    calendar: readCsvEntry(entries, 'calendar.txt'),
    calendarDates: readCsvEntry(entries, 'calendar_dates.txt'),
    shapes: readCsvEntry(entries, 'shapes.txt'),
  };
}

async function downloadBytes(url: string, options: GtfsStaticLoadOptions): Promise<Uint8Array> {
  const parsed = assertHttpUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
  try {
    const response = await fetch(parsed, {
      cache: 'no-store',
      headers: options.headers,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`GTFS static request failed with HTTP ${response.status}`);
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > maxBytes) throw new Error(`GTFS static archive exceeds ${maxBytes} bytes`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0) throw new Error('GTFS static archive is empty');
    if (bytes.byteLength > maxBytes) throw new Error(`GTFS static archive exceeds ${maxBytes} bytes`);
    return bytes;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`GTFS static request timed out after ${options.timeoutMs ?? 10_000} ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadGtfsStatic(
  source: string,
  options: GtfsStaticLoadOptions = {},
): Promise<GtfsStaticFiles> {
  const isRemote = /^https?:\/\//i.test(source);
  let bytes: Uint8Array;
  if (isRemote) {
    bytes = await downloadBytes(source, options);
  } else {
    const absolutePath = resolve(source);
    if (extname(absolutePath).toLowerCase() !== '.zip') {
      throw new Error('Local GTFS source must be a .zip file');
    }
    bytes = new Uint8Array(await readFile(absolutePath));
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    if (bytes.byteLength > maxBytes) throw new Error(`GTFS static archive exceeds ${maxBytes} bytes`);
  }
  return parseGtfsStaticZip(bytes);
}
