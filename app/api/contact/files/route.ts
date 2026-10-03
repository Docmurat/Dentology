// app/api/contact/files/route.ts
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/anti-spam";
import { uploadPrivate } from "@/lib/storage";
import { XRAY_UPLOAD_ENABLED } from "@/lib/constants";
import {
  MAX_FILE_BYTES,
  cleanFileName,
  deleteLeadFileRow,
  insertLeadFile,
  leadExists,
  sniffFileType,
  verifyUploadToken,
} from "@/lib/lead-files";

/**
 * Приём одного файла (снимка) к уже сохранённой заявке.
 *
 * Файлы идут отдельными запросами после /api/contact: заявка к этому
 * моменту в базе, и сбой загрузки её не теряет. Каждый запрос несёт
 * подписанный пропуск, выданный при создании заявки, — приложить файл
 * к чужой заявке или без заявки нельзя.
 *
 * ВАЖНО для сервера: Nginx по умолчанию режет тело запроса на 1 МБ.
 * В конфиге сайта должно быть client_max_body_size не меньше 12m,
 * иначе файлы крупнее 1 МБ не дойдут (заявка при этом сохранится).
 */

const UNAVAILABLE = "Не удалось сохранить файл. Заявка принята без него.";

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

// Тело запроса: сам файл плюс служебные поля формы.
const MAX_BODY_BYTES = MAX_FILE_BYTES + 1024 * 1024;

export async function POST(request: Request) {
  if (!XRAY_UPLOAD_ENABLED) return fail(UNAVAILABLE, 404);

  // Пропуск идёт заголовком и проверяется ДО чтения тела: адрес открытый,
  // и без этого сервер послушно загружал бы в память любой присланный
  // файл, прежде чем понять, что отправитель посторонний.
  const leadId = verifyUploadToken(request.headers.get("x-upload-token"));
  if (!leadId) {
    return fail("Срок загрузки истёк. Заявка принята без файла.", 403);
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return fail("Файл слишком большой: допускается до 10 МБ.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Некорректный запрос.", 400);
  }

  // Потолок с запасом: три файла на заявку, пять заявок в час.
  const limit = await rateLimit("contact-file", {
    limit: process.env.NODE_ENV === "production" ? 20 : 200,
    windowSec: 3600,
  });
  if (!limit.allowed) {
    return fail("Слишком много файлов. Заявка принята без файла.", 429);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Файл не выбран.", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail("Файл слишком большой: допускается до 10 МБ.", 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffFileType(bytes);
  if (!type) {
    return fail("Формат не поддерживается. Пришлите JPG, PNG или PDF.", 415);
  }

  const fileId = crypto.randomUUID();
  const storageKey = `lead-files/${leadId}/${fileId}.${type.ext}`;

  try {
    if (!(await leadExists(leadId))) {
      return fail(UNAVAILABLE, 404);
    }

    // Сначала строка в базе, потом объект: если таблицы ещё нет или лимит
    // исчерпан, в хранилище ничего не попадёт и «бесхозных» файлов не будет.
    const inserted = await insertLeadFile({
      id: fileId,
      leadId,
      storageKey,
      fileName: cleanFileName(file.name),
      contentType: type.contentType,
      sizeBytes: file.size,
    });
    if (!inserted) {
      return fail("К заявке уже приложено максимальное число файлов.", 409);
    }
  } catch (error) {
    console.error("LEAD_FILE_DB_ERROR", error);
    return fail(UNAVAILABLE, 503);
  }

  try {
    await uploadPrivate(storageKey, bytes, type.contentType);
  } catch (error) {
    console.error("LEAD_FILE_UPLOAD_ERROR", error);
    await deleteLeadFileRow(fileId).catch(() => undefined);
    return fail(UNAVAILABLE, 502);
  }

  return NextResponse.json({ ok: true, message: "Файл получен." });
}
