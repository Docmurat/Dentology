// app/api/leads/files/[id]/route.ts
import { canModerate, getCurrentUser } from "@/lib/auth-guards";
import { getLeadFileForDownload } from "@/lib/lead-files";
import { getPrivateObject } from "@/lib/storage";

/**
 * Выдача файла заявки (снимка пациента) сотруднику.
 *
 * Объект в хранилище закрыт, прямой ссылки на него нет: читает его сервер
 * и отдаёт только тому, кто имеет доступ к заявкам. Всем остальным — 404,
 * чтобы по ответу нельзя было понять, существует ли файл.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Только типы, которые пропускает проверка при загрузке. Значение из базы
// сверяем заново: отдать что-то как text/html отсюда не должно быть возможно.
const SAFE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function notFound() {
  return new Response("Not found", { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canModerate(user)) return notFound();

  const { id } = await params;
  if (!UUID_RE.test(id)) return notFound();

  let file: Awaited<ReturnType<typeof getLeadFileForDownload>>;
  try {
    file = await getLeadFileForDownload(id);
  } catch (error) {
    console.error("LEAD_FILE_LOOKUP_ERROR", error);
    return notFound();
  }
  if (!file || !SAFE_TYPES.has(file.contentType)) return notFound();

  let bytes: Uint8Array | null;
  try {
    bytes = await getPrivateObject(file.storageKey);
  } catch (error) {
    console.error("LEAD_FILE_READ_ERROR", error);
    return new Response("Storage error", { status: 502 });
  }
  if (!bytes) return notFound();

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
