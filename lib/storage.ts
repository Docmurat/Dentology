import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Yandex Object Storage — S3-совместимое хранилище.
// Настройки берём из окружения (.env на сервере).
const ENDPOINT = process.env.S3_ENDPOINT || "https://storage.yandexcloud.net";
const REGION = process.env.S3_REGION || "ru-central1";
const BUCKET = process.env.S3_BUCKET || "lucenta-media";

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

/** Публичный URL объекта в бакете. */
export function publicUrl(path: string): string {
  return `${ENDPOINT}/${BUCKET}/${path.replace(/^\/+/, "")}`;
}

/**
 * Загружает файл в хранилище и возвращает публичную ссылку.
 * path — путь внутри бакета, например "case-images/slug/cover-123.jpg".
 */
export async function uploadToStorage(
  path: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const key = path.replace(/^\/+/, "");
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    })
  );
  return publicUrl(key);
}

/** Загружает File (из FormData) — удобная обёртка. */
export async function uploadFile(path: string, file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadToStorage(path, buffer, file.type || "application/octet-stream");
}

/** Удаляет объект из хранилища (не обязателен, но полезен). */
export async function deleteFromStorage(path: string): Promise<void> {
  const key = path.replace(/^\/+/, "");
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

const PRIVATE_TIMEOUT_MS = 25_000;

/**
 * Загружает файл как ЗАКРЫТЫЙ объект: по прямой ссылке он недоступен,
 * прочитать его можно только через getPrivateObject (то есть через наш
 * сервер, после проверки прав).
 *
 * Используется для снимков пациентов из формы заявки: это сведения
 * о здоровье, публичная ссылка на них недопустима.
 */
export async function uploadPrivate(
  path: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const key = path.replace(/^\/+/, "");
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "private",
    }),
    // Если хранилище не отвечает, посетитель не должен бесконечно
    // смотреть на «Загружаем снимки…».
    { abortSignal: AbortSignal.timeout(PRIVATE_TIMEOUT_MS) }
  );
}

/** Читает закрытый объект целиком. null — если объекта нет. */
export async function getPrivateObject(
  path: string
): Promise<Uint8Array | null> {
  const key = path.replace(/^\/+/, "");
  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { abortSignal: AbortSignal.timeout(PRIVATE_TIMEOUT_MS) }
    );
    if (!res.Body) return null;
    return await res.Body.transformToByteArray();
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw err;
  }
}


// ── Крупные файлы (КЛКТ): загрузка из браузера напрямую в хранилище ──
//
// Архив КЛКТ весит сотни мегабайт, через наш сервер его не провести.
// Сервер только открывает многочастную загрузку и выдаёт браузеру
// подписанные ссылки на каждую часть; сами байты идут из браузера прямо
// в Object Storage. Для этого у бакета должен быть настроен CORS
// (scripts/setup-bucket.mjs).
//
// Отдельный клиент: контрольные суммы только там, где они обязательны.
// Новые версии SDK по умолчанию вшивают в подписанные ссылки параметры
// контрольной суммы, и браузер, который их не отправляет, получает отказ.
const directClient = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const DIRECT_TIMEOUT_MS = 30_000;

function directSignal() {
  return { abortSignal: AbortSignal.timeout(DIRECT_TIMEOUT_MS) };
}

/** Открывает многочастную загрузку закрытого объекта, возвращает её id. */
export async function startMultipartUpload(
  key: string,
  contentType: string
): Promise<string> {
  const res = await directClient.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "private",
    }),
    directSignal()
  );
  if (!res.UploadId) throw new Error("No UploadId from storage");
  return res.UploadId;
}

/**
 * Подписанные ссылки на загрузку частей. partSizes[i] — точный размер
 * части i+1 в байтах.
 *
 * Размер вшит в подпись (content-length среди подписанных заголовков):
 * хранилище отклонит часть другого размера. Без этого по одной ссылке
 * можно было бы залить до 5 ГБ, а проверка размера после сборки
 * не спасает, если загрузку так и не завершают.
 */
export async function signUploadParts(
  key: string,
  uploadId: string,
  partSizes: number[],
  expiresInSec: number
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < partSizes.length; i++) {
    urls.push(
      await getSignedUrl(
        directClient,
        new UploadPartCommand({
          Bucket: BUCKET,
          Key: key,
          UploadId: uploadId,
          PartNumber: i + 1,
          ContentLength: partSizes[i],
        }),
        {
          expiresIn: expiresInSec,
          signableHeaders: new Set(["content-length"]),
        }
      )
    );
  }
  return urls;
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
): Promise<void> {
  await directClient.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }),
    // Сборка сотен мегабайт на стороне хранилища может идти дольше.
    { abortSignal: AbortSignal.timeout(120_000) }
  );
}

export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  await directClient.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
    }),
    directSignal()
  );
}

/** Размер объекта в байтах (null — объекта нет). */
export async function objectSize(key: string): Promise<number | null> {
  try {
    const res = await directClient.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
      directSignal()
    );
    return typeof res.ContentLength === "number" ? res.ContentLength : null;
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "NotFound" || name === "NoSuchKey") return null;
    throw err;
  }
}

/** Первые байты объекта — чтобы проверить, что это действительно архив. */
export async function readObjectStart(
  key: string,
  length = 16
): Promise<Uint8Array> {
  const res = await directClient.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: `bytes=0-${length - 1}`,
    }),
    directSignal()
  );
  if (!res.Body) return new Uint8Array();
  return res.Body.transformToByteArray();
}

/** Удаление объекта по ключу (тот же клиент, без контрольных сумм). */
export async function deleteObjectQuiet(key: string): Promise<void> {
  try {
    await directClient.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
      directSignal()
    );
  } catch (err) {
    console.error("STORAGE_DELETE_FAILED", key, err);
  }
}

/** encodeURIComponent оставляет ' ( ) *, а в filename* они недопустимы. */
function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Короткая подписанная ссылка на скачивание закрытого объекта.
 * Выдаётся сотруднику после проверки прав: большой архив не нужно
 * пропускать через наш сервер.
 */
export async function signDownload(
  key: string,
  fileName: string,
  expiresInSec = 300
): Promise<string> {
  return getSignedUrl(
    directClient,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeRfc5987(fileName)}`,
    }),
    { expiresIn: expiresInSec }
  );
}
