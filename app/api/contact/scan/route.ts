// app/api/contact/scan/route.ts
import { NextResponse, after } from "next/server";
import { rateLimit } from "@/lib/anti-spam";
import { XRAY_UPLOAD_ENABLED } from "@/lib/constants";
import {
  MAX_SCAN_BYTES,
  MAX_SCANS_PER_LEAD,
  SCAN_PART_BYTES,
  SCAN_PREFIX,
  ARCHIVE_TYPES,
  archiveExtFromName,
  cleanFileName,
  countLeadFiles,
  insertLeadFile,
  leadContact,
  leadExists,
  sniffArchive,
  verifyUploadToken,
} from "@/lib/lead-files";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  deleteObjectQuiet,
  objectSize,
  readObjectStart,
  signUploadParts,
  startMultipartUpload,
} from "@/lib/storage";
import { sendTelegramMessage, tgEscape } from "@/lib/telegram";
import { sendPushToStaff } from "@/lib/push";

/**
 * Загрузка архива КЛКТ к уже сохранённой заявке.
 *
 * Файл идёт из браузера напрямую в Object Storage, частями. Этот маршрут
 * только управляет загрузкой:
 *   start    — открыть загрузку, выдать подписанные ссылки на части;
 *   complete — собрать части, проверить, что это архив, записать в заявку;
 *   abort    — отменить незавершённую загрузку.
 *
 * Пропуск (x-upload-token) тот же, что у снимков: выдаётся при создании
 * заявки и привязан к ней. Ключ объекта строится здесь, и при complete
 * и abort проверяется, что он принадлежит той же заявке.
 *
 * Незавершённые загрузки бакет сам удаляет через сутки, готовые архивы —
 * через 90 дней (правила задаёт scripts/setup-bucket.mjs).
 */

// Подписанные ссылки на части живут столько же, сколько пропуск.
const PART_URL_TTL_SEC = 6 * 60 * 60;
const MAX_PARTS = Math.ceil(MAX_SCAN_BYTES / SCAN_PART_BYTES);
const UNAVAILABLE = "Не удалось загрузить КЛКТ. Заявка принята без него.";
const UPLOAD_ID_RE = /^[A-Za-z0-9._~+/=-]{1,1024}$/;

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} МБ`;
}

type Body = {
  action?: string;
  fileName?: string;
  size?: number;
  key?: string;
  uploadId?: string;
  parts?: { PartNumber?: number; ETag?: string }[];
};

export async function POST(request: Request) {
  if (!XRAY_UPLOAD_ENABLED) return fail(UNAVAILABLE, 404);

  const leadId = verifyUploadToken(request.headers.get("x-upload-token"));
  if (!leadId) {
    return fail("Срок загрузки истёк. Заявка принята без КЛКТ.", 403);
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail("Некорректный запрос.", 400);
  }

  const ownPrefix = `${SCAN_PREFIX}/${leadId}/`;

  try {
    switch (body.action) {
      case "start":
        return await start(leadId, ownPrefix, body);
      case "complete":
        return await complete(leadId, ownPrefix, body);
      case "abort":
        return await abort(ownPrefix, body);
      default:
        return fail("Некорректный запрос.", 400);
    }
  } catch (error) {
    console.error("LEAD_SCAN_ERROR", body.action, error);
    return fail(UNAVAILABLE, 502);
  }
}

async function start(leadId: string, ownPrefix: string, body: Body) {
  const limit = await rateLimit("contact-scan", {
    limit: process.env.NODE_ENV === "production" ? 6 : 100,
    windowSec: 3600,
  });
  if (!limit.allowed) {
    return fail("Слишком много загрузок. Заявка принята без КЛКТ.", 429);
  }

  const fileName = String(body.fileName ?? "");
  const size = Number(body.size);
  const ext = archiveExtFromName(fileName);

  if (!ext) {
    return fail("Нужен архив .zip, .rar или .7z.", 415);
  }
  if (!Number.isInteger(size) || size <= 0) {
    return fail("Некорректный запрос.", 400);
  }
  if (size > MAX_SCAN_BYTES) {
    return fail("Архив больше 1,5 ГБ. Перешлите его на почту клиники.", 413);
  }

  if (!(await leadExists(leadId))) return fail(UNAVAILABLE, 404);

  const { scans } = await countLeadFiles(leadId);
  if (scans >= MAX_SCANS_PER_LEAD) {
    return fail("К заявке уже приложен КЛКТ.", 409);
  }

  const key = `${ownPrefix}${crypto.randomUUID()}.${ext}`;
  const uploadId = await startMultipartUpload(key, ARCHIVE_TYPES[ext]);
  const partCount = Math.ceil(size / SCAN_PART_BYTES);
  const urls = await signUploadParts(key, uploadId, partCount, PART_URL_TTL_SEC);

  return NextResponse.json({
    ok: true,
    key,
    uploadId,
    partSize: SCAN_PART_BYTES,
    urls,
  });
}

async function complete(leadId: string, ownPrefix: string, body: Body) {
  const key = String(body.key ?? "");
  const uploadId = String(body.uploadId ?? "");
  if (!key.startsWith(ownPrefix) || !UPLOAD_ID_RE.test(uploadId)) {
    return fail("Некорректный запрос.", 400);
  }

  const raw = Array.isArray(body.parts) ? body.parts : [];
  const parts = raw
    .map((p) => ({
      PartNumber: Number(p?.PartNumber),
      ETag: String(p?.ETag ?? ""),
    }))
    .sort((a, b) => a.PartNumber - b.PartNumber);

  const valid =
    parts.length > 0 &&
    parts.length <= MAX_PARTS &&
    parts.every(
      (p, i) =>
        p.PartNumber === i + 1 && p.ETag.length > 0 && p.ETag.length <= 200
    );
  if (!valid) return fail("Некорректный запрос.", 400);

  await completeMultipartUpload(key, uploadId, parts);

  // Части грузил браузер напрямую, поэтому проверяем результат здесь:
  // размер (ссылки на части не ограничивают объём) и что это архив.
  const size = await objectSize(key);
  if (size === null) return fail(UNAVAILABLE, 502);
  if (size > MAX_SCAN_BYTES) {
    await deleteObjectQuiet(key);
    return fail("Архив больше 1,5 ГБ. Перешлите его на почту клиники.", 413);
  }

  const type = sniffArchive(await readObjectStart(key));
  if (!type || ARCHIVE_TYPES[key.split(".").pop() ?? ""] !== type.contentType) {
    await deleteObjectQuiet(key);
    return fail("Файл не похож на архив .zip, .rar или .7z.", 415);
  }

  // Имя — только для показа сотруднику; расширение — по содержимому.
  const fileName = cleanFileName(String(body.fileName ?? "КЛКТ"), type.ext);
  const inserted = await insertLeadFile({
    id: crypto.randomUUID(),
    leadId,
    storageKey: key,
    fileName,
    contentType: type.contentType,
    sizeBytes: size,
  });
  if (!inserted) {
    await deleteObjectQuiet(key);
    return fail("К заявке уже приложено максимальное число файлов.", 409);
  }

  after(() => notifyScan(leadId, size));

  return NextResponse.json({ ok: true, message: "КЛКТ получен." });
}

async function abort(ownPrefix: string, body: Body) {
  const key = String(body.key ?? "");
  const uploadId = String(body.uploadId ?? "");
  if (!key.startsWith(ownPrefix) || !UPLOAD_ID_RE.test(uploadId)) {
    return fail("Некорректный запрос.", 400);
  }
  await abortMultipartUpload(key, uploadId).catch((error) =>
    console.error("LEAD_SCAN_ABORT_FAILED", error)
  );
  return NextResponse.json({ ok: true });
}

/** Отдельное уведомление: архив грузится долго, приходит позже заявки. */
async function notifyScan(leadId: string, size: number): Promise<void> {
  const contact = await leadContact(leadId).catch(() => null);
  const who = contact ? `${contact.name} · ${contact.phone}` : "заявка";

  await Promise.allSettled([
    sendTelegramMessage(
      [
        "🦷 <b>К заявке приложен КЛКТ</b>",
        "",
        tgEscape(who),
        `Архив: ${formatMb(size)}`,
        "",
        "Скачать: /admin/leads",
      ].join("\n")
    ),
    sendPushToStaff({
      title: "🦷 КЛКТ к заявке",
      body: `${who} · ${formatMb(size)}`,
      url: "/moderator",
    }),
  ]);
}
