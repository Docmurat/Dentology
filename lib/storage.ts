import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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