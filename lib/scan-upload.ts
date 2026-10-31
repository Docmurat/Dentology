// lib/scan-upload.ts
//
// Загрузка архива КЛКТ из браузера: файл режется на части и каждая часть
// уходит напрямую в хранилище по подписанной ссылке, полученной от сервера
// (app/api/contact/scan/route.ts). Через наш сервер байты не идут.
//
// Пациенту делить архив не нужно: File.slice() отдаёт кусок файла без
// чтения его целиком в память, поэтому даже 1,5 ГБ не нагружают телефон.

export type ScanProgress = { sent: number; total: number };

type StartResponse = {
  ok: boolean;
  message?: string;
  key?: string;
  uploadId?: string;
  partSize?: number;
  urls?: string[];
};

const PARALLEL_PARTS = 3;
const PART_ATTEMPTS = 4;
const PART_TIMEOUT_MS = 15 * 60 * 1000;

class UploadAborted extends Error {}

async function api(
  token: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal
): Promise<{ ok: boolean; message?: string } & Record<string, unknown>> {
  const response = await fetch("/api/contact/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-upload-token": token },
    body: JSON.stringify(payload),
    signal,
  });
  try {
    return await response.json();
  } catch {
    return { ok: false, message: "Сервер вернул некорректный ответ." };
  }
}

/**
 * Одна часть через XMLHttpRequest, а не fetch: только он сообщает
 * прогресс отправки — без этого полоса стояла бы на месте минуту и больше
 * на каждой части при медленном интернете.
 */
function putPart(
  url: string,
  blob: Blob,
  onBytes: (sent: number) => void,
  signal: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new UploadAborted());

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.timeout = PART_TIMEOUT_MS;

    const onAbort = () => xhr.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    const done = () => signal.removeEventListener("abort", onAbort);

    xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => {
      done();
      if (xhr.status >= 200 && xhr.status < 300) {
        // ETag виден, только если бакет его отдаёт по CORS (ExposeHeaders).
        const etag = xhr.getResponseHeader("ETag");
        if (etag) resolve(etag);
        else reject(new Error("no-etag"));
      } else {
        reject(new Error(`status-${xhr.status}`));
      }
    };
    xhr.onerror = () => {
      done();
      reject(new Error("network"));
    };
    xhr.ontimeout = () => {
      done();
      reject(new Error("timeout"));
    };
    xhr.onabort = () => {
      done();
      reject(new UploadAborted());
    };

    xhr.send(blob);
  });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new UploadAborted());
      },
      { once: true }
    );
  });
}

/**
 * Загружает архив к заявке. Возвращает текст ошибки или null при успехе.
 * Отмена через signal — тоже ошибка («Загрузка отменена»).
 */
export async function uploadScan(
  token: string,
  file: File,
  onProgress: (p: ScanProgress) => void,
  signal: AbortSignal
): Promise<string | null> {
  const total = file.size;
  onProgress({ sent: 0, total });

  let start: StartResponse;
  try {
    start = (await api(
      token,
      { action: "start", fileName: file.name, size: total },
      signal
    )) as StartResponse;
  } catch {
    return signal.aborted ? "Загрузка отменена." : "Нет соединения с сервером.";
  }
  if (!start.ok || !start.key || !start.uploadId || !start.urls || !start.partSize) {
    return start.message || "Не удалось начать загрузку.";
  }

  const { key, uploadId, urls, partSize } = start;
  const sentByPart = new Array<number>(urls.length).fill(0);
  const etags = new Array<string>(urls.length);
  const report = () =>
    onProgress({
      sent: Math.min(total, sentByPart.reduce((a, b) => a + b, 0)),
      total,
    });

  let next = 0;
  let noEtag = false;

  async function worker() {
    while (next < urls.length) {
      const index = next++;
      const blob = file.slice(index * partSize, Math.min(total, (index + 1) * partSize));

      for (let attempt = 1; ; attempt++) {
        try {
          etags[index] = await putPart(
            urls[index],
            blob,
            (sent) => {
              sentByPart[index] = sent;
              report();
            },
            signal
          );
          sentByPart[index] = blob.size;
          report();
          break;
        } catch (err) {
          if (err instanceof UploadAborted) throw err;
          if ((err as Error).message === "no-etag") {
            noEtag = true;
            throw err;
          }
          sentByPart[index] = 0;
          report();
          if (attempt >= PART_ATTEMPTS) throw err;
          // Пауза растёт: 2, 4, 8 секунд — даём связи восстановиться.
          await wait(1000 * 2 ** attempt, signal);
        }
      }
    }
  }

  try {
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL_PARTS, urls.length) }, worker)
    );
  } catch (err) {
    // Незавершённую загрузку закрываем, чтобы части не лежали в хранилище.
    api(token, { action: "abort", key, uploadId }).catch(() => undefined);
    if (err instanceof UploadAborted) return "Загрузка отменена.";
    if (noEtag) {
      console.error("SCAN_UPLOAD: ETag header not exposed — bucket CORS needs ExposeHeaders: ETag");
      return "Хранилище не приняло файл.";
    }
    return "Связь прервалась, и загрузить архив не удалось.";
  }

  let done: { ok: boolean; message?: string };
  try {
    done = await api(token, {
      action: "complete",
      key,
      uploadId,
      fileName: file.name,
      parts: etags.map((ETag, i) => ({ PartNumber: i + 1, ETag })),
    });
  } catch {
    return "Нет соединения с сервером при завершении загрузки.";
  }
  return done.ok ? null : done.message || "Не удалось завершить загрузку.";
}
