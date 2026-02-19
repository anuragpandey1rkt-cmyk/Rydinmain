/**
 * Manual Event Ingestion Script
 * This script runs the Ticketmaster ingestion logic locally to populate your database.
 * 
 * Usage:
 * bun run scripts/ingest-manual.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { ingestEvents } from "../api/_lib/eventsIngestion";

async function runManualIngest() {
    console.log("🚀 Starting manual event ingestion...");

    try {
        const result = await ingestEvents();
        console.log("✅ Ingestion complete!");
        console.log("-------------------");
        console.log(`Events Generated: ${result.generated}`);
        console.log(`Message:          ${result.message}`);
        console.log("-------------------");
        console.log("You should now see events appearing in your local app.");
    } catch (error: any) {
        console.error("❌ Ingestion failed!");
        console.error(error.message);

        if (error.message.includes("TICKETMASTER_API_KEY")) {
            console.log("\nTIP: Make sure you've added TICKETMASTER_API_KEY to your .env file.");
        }
        if (error.message.includes("SUPABASE")) {
            console.log("\nTIP: Make sure you've added SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.");
        }
        if (error.message.includes("AUTO_EVENT_CREATOR_ID")) {
            console.log("\nTIP: You MUST create at least one user in your app first and put their ID in .env as AUTO_EVENT_CREATOR_ID.");
        }
    }
}

runManualIngest();
