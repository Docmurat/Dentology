// scripts/setup-bucket.mjs
//
// Настройка бакета Object Storage под загрузку КЛКТ с сайта.
//
// Запуск из корня проекта на сервере:
//   node --env-file=.env scripts/setup-bucket.mjs           — только показать
//   node --env-file=.env scripts/setup-bucket.mjs --apply   — показать и применить
//
// Что делает:
//   1. CORS: разрешает браузеру со страниц сайта загружать части архива
//      прямо в бакет (метод PUT) и читать заголовок ETag.
//   2. Срок хранения для папки lead-scans/: готовые архивы удаляются через
//      90 дней, брошенные незавершённые загрузки — через сутки.
//   3. Показывает, открыт ли бакет на чтение всем (проверка приватности).
//
// Существующие правила CORS и срока хранения сохраняются: скрипт только
// добавляет свои, если их ещё нет.

import { S3Client } from "@aws-sdk/client-s3";
import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  GetBucketAclCommand,
} from "@aws-sdk/client-s3";

const apply = process.argv.includes("--apply");

const BUCKET = process.env.S3_BUCKET || "lucenta-media";
const ORIGINS = (process.env.SITE_ORIGINS ||
  "https://lucenta.ru,https://www.lucenta.ru,http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SCAN_PREFIX = "lead-scans/";
const KEEP_DAYS = Number(process.env.SCAN_KEEP_DAYS || 90);

if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
  console.error("Не заданы S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY. Запускайте с --env-file=.env.");
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "https://storage.yandexcloud.net",
  region: process.env.S3_REGION || "ru-central1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const CORS_ID = "lucenta-direct-upload";
const corsRule = {
  ID: CORS_ID,
  AllowedOrigins: ORIGINS,
  AllowedMethods: ["PUT"],
  AllowedHeaders: ["*"],
  ExposeHeaders: ["ETag"],
  MaxAgeSeconds: 3600,
};

const LIFECYCLE_ID = "lucenta-lead-scans";
const lifecycleRule = {
  ID: LIFECYCLE_ID,
  Status: "Enabled",
  Filter: { Prefix: SCAN_PREFIX },
  Expiration: { Days: KEEP_DAYS },
  AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
};

function missing(err) {
  const name = err?.name || err?.Code || "";
  return /NoSuch(CORS|Lifecycle)Configuration|NotFound/i.test(name);
}

let failed = false;

// ── 1. CORS ──
try {
  let rules = [];
  try {
    rules = (await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET }))).CORSRules ?? [];
  } catch (err) {
    if (!missing(err)) throw err;
  }
  const others = rules.filter((r) => r.ID !== CORS_ID);
  console.log(`CORS: правил сейчас ${rules.length}${rules.some((r) => r.ID === CORS_ID) ? " (наше уже есть, обновим)" : ""}`);
  if (apply) {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET,
        CORSConfiguration: { CORSRules: [...others, corsRule] },
      })
    );
    console.log(`CORS: применено. Разрешена загрузка с ${ORIGINS.join(", ")}`);
  }
} catch (err) {
  failed = true;
  console.error(`CORS: ОШИБКА — ${err?.name || ""} ${err?.message || err}`);
}

// ── 2. Срок хранения ──
try {
  let rules = [];
  try {
    rules =
      (await s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: BUCKET }))).Rules ?? [];
  } catch (err) {
    if (!missing(err)) throw err;
  }
  const others = rules.filter((r) => r.ID !== LIFECYCLE_ID);
  console.log(`Срок хранения: правил сейчас ${rules.length}`);
  if (apply) {
    await s3.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: BUCKET,
        LifecycleConfiguration: { Rules: [...others, lifecycleRule] },
      })
    );
    console.log(`Срок хранения: применено. Архивы КЛКТ (${SCAN_PREFIX}) удаляются через ${KEEP_DAYS} дней.`);
  }
} catch (err) {
  failed = true;
  console.error(`Срок хранения: ОШИБКА — ${err?.name || ""} ${err?.message || err}`);
}

// ── 3. Открыт ли бакет всем ──
try {
  const acl = await s3.send(new GetBucketAclCommand({ Bucket: BUCKET }));
  const publicGrants = (acl.Grants ?? []).filter((g) =>
    /AllUsers|AuthenticatedUsers/i.test(g.Grantee?.URI || "")
  );
  if (publicGrants.length) {
    console.log(
      "Доступ: ВНИМАНИЕ — бакет открыт всем: " +
        publicGrants.map((g) => g.Permission).join(", ") +
        ". Закройте публичное чтение объектов и списка в консоли."
    );
  } else {
    console.log("Доступ: публичных прав на уровне бакета нет — хорошо.");
  }
} catch (err) {
  console.error(`Доступ: не удалось проверить — ${err?.name || ""} ${err?.message || err}`);
}

if (!apply) console.log("\nЭто был просмотр. Чтобы применить, добавьте --apply.");
process.exit(failed ? 1 : 0);
