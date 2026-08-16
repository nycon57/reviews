/**
 * One-off: uploads the curated clip-music tracks to the public `clip-music`
 * bucket and seeds clip_music_tracks. Idempotent: skips tracks whose
 * storage_path already has a row.
 *
 * Run: npx tsx --env-file=.env scripts/seed-clip-music.ts <stagingDir>
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "clip-music";

const TRACKS = [
  {
    file: "rise-to-inspire.mp3",
    name: "Rise to Inspire",
    mood: "Upbeat",
    description: "Driving synth bass, energetic drums, and a modern melody. Motivational corporate pop.",
    durationSeconds: 61.9,
    sortOrder: 1,
  },
  {
    file: "urban-chill-groove.mp3",
    name: "Urban Chill Groove",
    mood: "Chill",
    description: "Laid-back hip-hop beat with smooth synth pads and a groovy bassline.",
    durationSeconds: 65.7,
    sortOrder: 2,
  },
  {
    file: "digital-energy.mp3",
    name: "Digital Energy",
    mood: "Energetic",
    description: "Driving electronic drums and pulsating synths with a steady, modern pulse.",
    durationSeconds: 61.4,
    sortOrder: 3,
  },
  {
    file: "peaceful-reflection.mp3",
    name: "Peaceful Reflection",
    mood: "Calm",
    description: "Delicate piano, warm strings, and subtle percussion. Serene and introspective.",
    durationSeconds: 165.1,
    sortOrder: 4,
  },
  {
    file: "retro-funk.mp3",
    name: "Retro Funk",
    mood: "Vintage",
    description: "Wah guitar, solid bassline, and driving drums. Energetic old-school funk.",
    durationSeconds: 63.5,
    sortOrder: 5,
  },
];

async function main() {
  const [stagingDir] = process.argv.slice(2);
  if (!stagingDir) {
    console.error("Usage: tsx scripts/seed-clip-music.ts <stagingDir>");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Bucket create failed: ${error.message}`);
    console.log(`Created public bucket ${BUCKET}`);
  }

  for (const track of TRACKS) {
    const storagePath = `library/${track.file}`;

    const { data: existing } = await supabase
      .from("clip_music_tracks")
      .select("id")
      .eq("storage_path", storagePath)
      .maybeSingle();
    if (existing) {
      console.log(`SKIP ${track.name} (already seeded)`);
      continue;
    }

    const body = readFileSync(join(stagingDir, track.file));
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, body, { contentType: "audio/mpeg", upsert: true });
    if (uploadError) throw new Error(`Upload failed for ${track.file}: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: insertError } = await supabase.from("clip_music_tracks").insert({
      name: track.name,
      mood: track.mood,
      description: track.description,
      storage_path: storagePath,
      url: urlData.publicUrl,
      duration_seconds: track.durationSeconds,
      sort_order: track.sortOrder,
    });
    if (insertError) throw new Error(`Insert failed for ${track.name}: ${insertError.message}`);

    console.log(`OK ${track.name} -> ${urlData.publicUrl}`);
  }
}

main().catch((err) => {
  console.error("SEED FAILED:", err);
  process.exit(1);
});
