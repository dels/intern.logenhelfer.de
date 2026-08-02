/**
 * Minimal multipart/form-data parser - N plain text fields plus exactly one
 * file part. Not a general RFC 2046 implementation (no nested multipart, no
 * RFC 2231/5987 `filename*`) - deliberately narrow, matching every current
 * caller's needs (attachedFiles.ts and logo.ts, the two routes in this API
 * that receive a real file upload). No multer/busboy/formidable dependency
 * is declared for this parsing: express-openapi-validator's own internal
 * multer instance already handles multipart parsing in production (see
 * contractValidation.ts) - this hand-rolled parser only runs in each route's
 * own isolated test harness, which mounts the router directly with no
 * contract-validation middleware in front.
 */

export interface ParsedMultipartFile {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface ParsedMultipart {
  fields: Record<string, string[]>;
  file?: ParsedMultipartFile;
}

export function extractBoundary(contentType: string): string | null {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) {
    return null;
  }
  return (match[1] ?? match[2] ?? '').trim();
}

function splitBuffer(buf: Buffer, sep: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let idx = buf.indexOf(sep, start);
  while (idx !== -1) {
    parts.push(buf.subarray(start, idx));
    start = idx + sep.length;
    idx = buf.indexOf(sep, start);
  }
  parts.push(buf.subarray(start));
  return parts;
}

/** Strips exactly one leading and one trailing CRLF, per RFC 2046's part framing (the CRLFs belong to the surrounding boundary delimiters, not the part itself). */
function trimSurroundingCrlf(buf: Buffer): Buffer {
  let result = buf;
  if (result.length >= 2 && result[0] === 0x0d && result[1] === 0x0a) {
    result = result.subarray(2);
  }
  if (result.length >= 2 && result[result.length - 2] === 0x0d && result[result.length - 1] === 0x0a) {
    result = result.subarray(0, result.length - 2);
  }
  return result;
}

function parsePartHeaders(headerText: string): { name: string; filename: string | null; contentType: string | null } | null {
  let name: string | null = null;
  let filename: string | null = null;
  let contentType: string | null = null;
  for (const line of headerText.split('\r\n')) {
    if (line.length === 0) {
      continue;
    }
    if (/^content-disposition:/i.test(line)) {
      name = /name="([^"]*)"/.exec(line)?.[1] ?? null;
      filename = /filename="([^"]*)"/.exec(line)?.[1] ?? null;
    } else if (/^content-type:/i.test(line)) {
      contentType = line.slice(line.indexOf(':') + 1).trim();
    }
  }
  if (name === null) {
    return null;
  }
  return { name, filename, contentType };
}

export function parseMultipart(body: Buffer, boundary: string): ParsedMultipart {
  const delimiter = Buffer.from(`--${boundary}`);
  const segments = splitBuffer(body, delimiter);
  const fields: Record<string, string[]> = {};
  let file: ParsedMultipart['file'];

  // segments[0] is the preamble before the first boundary; the last segment
  // (starting with "--\r\n", the closing delimiter) is the epilogue - neither
  // is a real part.
  for (const rawSegment of segments.slice(1, -1)) {
    const segment = trimSurroundingCrlf(rawSegment);
    const headerEnd = segment.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      continue;
    }

    const headers = parsePartHeaders(segment.subarray(0, headerEnd).toString('latin1'));
    if (!headers) {
      continue;
    }
    const content = segment.subarray(headerEnd + 4);

    if (headers.filename !== null) {
      file = { filename: headers.filename, contentType: headers.contentType ?? 'application/octet-stream', content: Buffer.from(content) };
    } else {
      const list = fields[headers.name] ?? [];
      list.push(content.toString('utf-8'));
      fields[headers.name] = list;
    }
  }

  return { fields, file };
}
