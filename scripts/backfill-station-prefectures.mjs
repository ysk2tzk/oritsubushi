import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_API_ENDPOINT =
  "https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress";
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_UPDATE_CONCURRENCY = 20;

const PREFECTURES_BY_CODE = {
  "01": "北海道",
  "02": "青森県",
  "03": "岩手県",
  "04": "宮城県",
  "05": "秋田県",
  "06": "山形県",
  "07": "福島県",
  "08": "茨城県",
  "09": "栃木県",
  "10": "群馬県",
  "11": "埼玉県",
  "12": "千葉県",
  "13": "東京都",
  "14": "神奈川県",
  "15": "新潟県",
  "16": "富山県",
  "17": "石川県",
  "18": "福井県",
  "19": "山梨県",
  "20": "長野県",
  "21": "岐阜県",
  "22": "静岡県",
  "23": "愛知県",
  "24": "三重県",
  "25": "滋賀県",
  "26": "京都府",
  "27": "大阪府",
  "28": "兵庫県",
  "29": "奈良県",
  "30": "和歌山県",
  "31": "鳥取県",
  "32": "島根県",
  "33": "岡山県",
  "34": "広島県",
  "35": "山口県",
  "36": "徳島県",
  "37": "香川県",
  "38": "愛媛県",
  "39": "高知県",
  "40": "福岡県",
  "41": "佐賀県",
  "42": "長崎県",
  "43": "熊本県",
  "44": "大分県",
  "45": "宮崎県",
  "46": "鹿児島県",
  "47": "沖縄県"
};

class InertWebSocket {
  static CLOSED = 3;

  constructor() {
    this.binaryType = "arraybuffer";
    this.readyState = InertWebSocket.CLOSED;
    this.bufferedAmount = 0;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
  }

  close() {
    this.readyState = InertWebSocket.CLOSED;
  }

  send() {}
}

loadEnvFiles();

function parseArgs(argv) {
  const args = {
    batchSize: DEFAULT_BATCH_SIZE,
    concurrency: DEFAULT_CONCURRENCY,
    apiEndpoint: DEFAULT_API_ENDPOINT,
    retryCount: DEFAULT_RETRY_COUNT,
    retryDelayMs: DEFAULT_RETRY_DELAY_MS,
    updateConcurrency: DEFAULT_UPDATE_CONCURRENCY,
    dryRun: false,
    onlyNull: true,
    startAfterId: null,
    limitBatches: null
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--only-null") {
      args.onlyNull = true;
      continue;
    }

    if (arg === "--include-filled") {
      args.onlyNull = false;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      args.batchSize = parsePositiveInt(arg.split("=")[1], "--batch-size");
      continue;
    }

    if (arg.startsWith("--concurrency=")) {
      args.concurrency = parsePositiveInt(arg.split("=")[1], "--concurrency");
      continue;
    }

    if (arg.startsWith("--retry-count=")) {
      args.retryCount = parseNonNegativeInt(arg.split("=")[1], "--retry-count");
      continue;
    }

    if (arg.startsWith("--retry-delay-ms=")) {
      args.retryDelayMs = parseNonNegativeInt(arg.split("=")[1], "--retry-delay-ms");
      continue;
    }

    if (arg.startsWith("--update-concurrency=")) {
      args.updateConcurrency = parsePositiveInt(
        arg.split("=")[1],
        "--update-concurrency"
      );
      continue;
    }

    if (arg.startsWith("--start-after-id=")) {
      args.startAfterId = parsePositiveInt(arg.split("=")[1], "--start-after-id");
      continue;
    }

    if (arg.startsWith("--limit-batches=")) {
      args.limitBatches = parsePositiveInt(arg.split("=")[1], "--limit-batches");
      continue;
    }

    if (arg.startsWith("--api-endpoint=")) {
      args.apiEndpoint = arg.split("=")[1];
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function loadEnvFiles() {
  const envFilePaths = [".env.local", ".env"].map((fileName) =>
    path.resolve(process.cwd(), fileName)
  );

  for (const envFilePath of envFilePaths) {
    if (!fs.existsSync(envFilePath)) {
      continue;
    }

    const content = fs.readFileSync(envFilePath, "utf8");
    applyEnvFile(content);
  }
}

function applyEnvFile(content) {
  const lines = content.split(/\r?\n/u);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function parsePositiveInt(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }

  return parsed;
}

function parseNonNegativeInt(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flagName} must be a non-negative integer.`);
  }

  return parsed;
}

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: InertWebSocket
    }
  });
}

async function fetchStationsBatch(supabase, options, lastProcessedId) {
  let query = supabase
    .from("mst_station")
    .select("id, name, latitude, longitude, prefecture")
    .eq("is_deleted", false)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("id", { ascending: true })
    .limit(options.batchSize);

  if (options.onlyNull) {
    query = query.is("prefecture", null);
  }

  if (lastProcessedId !== null) {
    query = query.gt("id", lastProcessedId);
  } else if (options.startAfterId !== null) {
    query = query.gt("id", options.startAfterId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stations: ${error.message}`);
  }

  return data ?? [];
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

async function reverseGeocodeStation(station, options) {
  const lat = Number(station.latitude);
  const lon = Number(station.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      stationId: station.id,
      stationName: station.name,
      prefecture: null,
      skipped: true,
      reason: "invalid_coordinates"
    };
  }

  for (let attempt = 1; attempt <= options.retryCount + 1; attempt += 1) {
    try {
      const url = new URL(options.apiEndpoint);
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "oritsubushi-prefecture-backfill/1.0"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const muniCd = payload?.results?.muniCd;

      if (typeof muniCd !== "string" || muniCd.length < 2) {
        return {
          stationId: station.id,
          stationName: station.name,
          prefecture: null,
          skipped: true,
          reason: "muni_code_not_found"
        };
      }

      const prefectureCode = muniCd.slice(0, 2);
      const prefecture = PREFECTURES_BY_CODE[prefectureCode] ?? null;

      if (!prefecture) {
        return {
          stationId: station.id,
          stationName: station.name,
          prefecture: null,
          skipped: true,
          reason: `unknown_prefecture_code:${prefectureCode}`
        };
      }

      return {
        stationId: station.id,
        stationName: station.name,
        prefecture,
        skipped: false,
        reason: null
      };
    } catch (error) {
      if (attempt > options.retryCount) {
        return {
          stationId: station.id,
          stationName: station.name,
          prefecture: null,
          skipped: true,
          reason: error instanceof Error ? error.message : String(error)
        };
      }

      await sleep(options.retryDelayMs * attempt);
    }
  }

  return {
    stationId: station.id,
    stationName: station.name,
    prefecture: null,
    skipped: true,
    reason: "unreachable_state"
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function updateStations(supabase, updates, concurrency) {
  await mapWithConcurrency(updates, concurrency, async (update) => {
    const { error } = await supabase
      .from("mst_station")
      .update({ prefecture: update.prefecture })
      .eq("id", update.stationId)
      .eq("is_deleted", false);

    if (error) {
      throw new Error(`Failed to update station ${update.stationId}: ${error.message}`);
    }
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const supabase = createSupabaseAdmin();

  console.log(
    [
      "Starting prefecture backfill.",
      `batchSize=${options.batchSize}`,
      `concurrency=${options.concurrency}`,
      `updateConcurrency=${options.updateConcurrency}`,
      `onlyNull=${options.onlyNull}`,
      `dryRun=${options.dryRun}`,
      `startAfterId=${options.startAfterId ?? "none"}`,
      `limitBatches=${options.limitBatches ?? "none"}`
    ].join(" ")
  );

  let processedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let batchCount = 0;
  let lastProcessedId = null;

  while (true) {
    if (options.limitBatches !== null && batchCount >= options.limitBatches) {
      break;
    }

    const stations = await fetchStationsBatch(supabase, options, lastProcessedId);

    if (stations.length === 0) {
      break;
    }

    batchCount += 1;
    lastProcessedId = stations.at(-1)?.id ?? lastProcessedId;
    console.log(
      `Processing batch ${batchCount}: ${stations.length} stations (lastStationId=${lastProcessedId}).`
    );

    const geocoded = await mapWithConcurrency(stations, options.concurrency, (station) =>
      reverseGeocodeStation(station, options)
    );

    const updates = [];
    const batchSkipped = [];

    for (let index = 0; index < geocoded.length; index += 1) {
      const result = geocoded[index];
      const station = stations[index];

      processedCount += 1;

      if (result.skipped) {
        skippedCount += 1;
        batchSkipped.push(result);
        continue;
      }

      if (station.prefecture === result.prefecture) {
        continue;
      }

      updates.push(result);
    }

    if (!options.dryRun && updates.length > 0) {
      await updateStations(supabase, updates, options.updateConcurrency);
    }

    updatedCount += updates.length;

    console.log(
      `Finished batch ${batchCount}: updates=${updates.length}, skipped=${batchSkipped.length}, processed=${processedCount}.`
    );

    if (batchSkipped.length > 0) {
      const preview = batchSkipped
        .slice(0, 10)
        .map((item) => `${item.stationId}:${item.reason}`)
        .join(", ");
      console.log(`Skipped sample: ${preview}`);
    }
  }

  console.log(
    `Completed prefecture backfill. batches=${batchCount} processed=${processedCount} updated=${updatedCount} skipped=${skippedCount}.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
