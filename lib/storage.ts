import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

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
