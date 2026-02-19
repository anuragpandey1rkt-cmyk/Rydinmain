
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// Initialize Supabase Admin Client
const createAdminClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

// Initialize Groq Client
const createGroqClient = () => {
  const apiKey = process.env.VITE_GROQ_API_KEY2;
  if (!apiKey) {
    throw new Error("Missing VITE_GROQ_API_KEY2. Please add it to your .env file.");
  }
  return new Groq({ apiKey });
};

const resolveEventCreatorId = async (supabase: ReturnType<typeof createAdminClient>) => {
  if (process.env.AUTO_EVENT_CREATOR_ID) return process.env.AUTO_EVENT_CREATOR_ID;

  const { data } = await supabase.from("profiles").select("id").limit(1);
  if (!data?.length) {
    throw new Error("No profile found. Set AUTO_EVENT_CREATOR_ID in '.env'.");
  }
  return data[0].id as string;
};

// Generate Events using Groq for a specific date range
const generateGroqEventsBatch = async (startDate: Date, endDate: Date, count: number) => {
  const groq = createGroqClient();

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const prompt = `
    Generate ${count} realistic, diverse events happening near SRM University, Kattankulathur, Chennai, India between ${startStr} and ${endStr}.
    DISTRIBUTE the dates evenly across this range.
    
    Focus on these categories: 
    - "hackathon" (coding, AI, tech)
    - "tech_talk" (seminars, workshops)
    - "sports" (cricket, football, badminton tournaments)
    - "concert" (music, DJ, live bands)
    - "fest" (college cultural fests, food festivals)

    Return ONLY a valid JSON array. No markdown, no explanations.
    Each object must have:
    - title (string)
    - description (string, max 200 chars)
    - category (one of the above)
    - location (specific venue names like "CRC Block", "TP Ganesan Auditorium", "Java Green", "Potheri Grounds")
    - lat (number, approx near 12.8231)
    - lng (number, approx near 80.0442)
    - event_date (YYYY-MM-DD format, within ${startStr} to ${endStr})
    - start_time (HH:MM:SS format, mostly evening)
    - image_url (use these realistic unsplash placeholders:
        - concert: https://images.unsplash.com/photo-1501281668745-f7f57925c3b4
        - tech_talk: https://images.unsplash.com/photo-1544531586-fde5298cdd40
        - hackathon: https://images.unsplash.com/photo-1504384308090-c54be3855485
        - sports: https://images.unsplash.com/photo-1631194758628-71ec7c35137e
        - fest: https://images.unsplash.com/photo-1459749411177-27595190a8e2
    )
    `;

  console.log(`🤖 Asking AI to generate ${count} events from ${startStr} to ${endStr}...`);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 8000, // Ensure enough tokens for large JSON
    });

    const content = chatCompletion.choices[0]?.message?.content || "[]";
    // Clean up if Groq returns markdown code blocks
    const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const events = JSON.parse(jsonString);
    return events;
  } catch (e: any) {
    console.error(`❌ Batch generation failed for ${startStr} to ${endStr}:`, e.message);
    return []; // Return empty on failure to allow other batches to succeed
  }
};

export const ingestEvents = async () => {
  const supabase = createAdminClient();
  const creatorId = await resolveEventCreatorId(supabase);
  const fetchedAtIso = new Date().toISOString();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 1. Cleanup Expired Events
  console.log(`🧹 Cleaning up events before ${todayStr}...`);
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .lt("event_date", todayStr);

  if (deleteError) {
    console.error("⚠️ Failed to cleanup expired events:", deleteError.message);
  }

  // 2. Generate New Data in Batches (to avoid Token Limits)
  // Batch 1: Days 0-14 (25 events)
  const batch1End = new Date(today);
  batch1End.setDate(today.getDate() + 14);
  const eventsBatch1 = await generateGroqEventsBatch(today, batch1End, 25);

  // Batch 2: Days 15-30 (25 events)
  const batch2Start = new Date(today);
  batch2Start.setDate(today.getDate() + 15);
  const batch2End = new Date(today);
  batch2End.setDate(today.getDate() + 30);
  const eventsBatch2 = await generateGroqEventsBatch(batch2Start, batch2End, 25);

  const generatedEvents = [...eventsBatch1, ...eventsBatch2];
  console.log(`✨ AI Generated Total: ${generatedEvents.length} events`);

  // 3. Map Key Fields
  const mappedEvents = generatedEvents.map((e: any, index: number) => ({
    source: "groq_gen",
    source_event_id: `gen_${e.event_date}_${Math.floor(Math.random() * 100000)}`,
    status: "active",
    title: e.title,
    description: e.description,
    category: e.category,
    location: e.location,
    // latitude: Number(e.lat),
    // longitude: Number(e.lng),
    event_date: e.event_date,
    event_time: e.start_time || "18:00:00",
    image_url: e.image_url,
    organizer_id: creatorId,
    created_at: fetchedAtIso,
    fetched_at: fetchedAtIso,
  }));

  // 4. Upsert to DB
  if (mappedEvents.length > 0) {
    const { error } = await supabase
      .from("events")
      .upsert(mappedEvents, { onConflict: "source,source_event_id" });

    if (error) {
      throw new Error(`Supabase Upsert Failed: ${error.message}`);
    }
  }

  return {
    ok: true,
    generated: mappedEvents.length,
    message: `Successfully generated ${mappedEvents.length} events (in 2 batches) and cleaned up expired ones.`
  };
};
