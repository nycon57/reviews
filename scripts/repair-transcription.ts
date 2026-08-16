/**
 * One-off repair: re-runs word-timestamp transcription for a video
 * testimonial response whose transcription column got corrupted (raw JSON
 * stored as text by the old Gemini fallback path).
 *
 * Run: npx tsx --env-file=.env scripts/repair-transcription.ts <responseId>
 */
import { createClient } from "@supabase/supabase-js";
import { transcribeWithWordTimestamps } from "../src/lib/share-studio/transcription-service";

async function main() {
  const [responseId] = process.argv.slice(2);
  if (!responseId) {
    console.error("Usage: tsx scripts/repair-transcription.ts <responseId>");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: response, error } = await supabase
    .from("video_testimonial_responses")
    .select("id, video_path, duration_seconds, transcription")
    .eq("id", responseId)
    .single();
  if (error || !response) throw new Error(`Response not found: ${error?.message}`);

  console.log("Current transcription head:", response.transcription?.slice(0, 80));

  const { data: signed, error: signError } = await supabase.storage
    .from("video-testimonials")
    .createSignedUrl(response.video_path, 3600);
  if (signError || !signed) throw new Error(`Sign failed: ${signError?.message}`);

  console.log("Transcribing...");
  const result = await transcribeWithWordTimestamps(signed.signedUrl, {
    durationSeconds: response.duration_seconds,
  });

  if (result.full_text.trim().startsWith("{")) {
    throw new Error("Transcript still looks like JSON; aborting without writing.");
  }

  const wordTimestampPayload = {
    full_text: result.full_text,
    segments: result.segments.map((segment) => ({ ...segment })),
    words: result.words.map((word) => ({ ...word })),
    provider: result.provider,
    model: result.model,
    created_at: new Date().toISOString(),
    flagged_word_count: result.words.filter((word) => word.flagged_for_review).length,
  };

  const { error: updateError } = await supabase
    .from("video_testimonial_responses")
    .update({
      transcription: result.full_text,
      word_timestamps: wordTimestampPayload,
      transcription_status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", responseId);
  if (updateError) throw new Error(`Update failed: ${updateError.message}`);

  console.log("REPAIRED.");
  console.log("New transcription head:", result.full_text.slice(0, 120));
  console.log("Words:", result.words.length, "Segments:", result.segments.length, "Provider:", result.provider);
}

main().catch((err) => {
  console.error("REPAIR FAILED:", err);
  process.exit(1);
});
