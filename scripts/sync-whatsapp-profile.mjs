/**
 * Syncs the Cloud API business profile the same way production apps do:
 * 1) Resumable Upload API → profile picture handle
 * 2) POST /{phone-number-id}/whatsapp_business_profile
 * 3) POST /{phone-number-id} with new_display_name
 *
 * Usage: node --env-file=.env.local scripts/sync-whatsapp-profile.mjs
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const GRAPH = "https://graph.facebook.com/v23.0";
const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
const appId = process.env.WHATSAPP_APP_ID?.trim() || "1370008601865031";
const imagePath = resolve("public/whatsapp/profile.png");

if (!token || !phoneNumberId) {
  console.error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  process.exit(1);
}

function authJson() {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function graph(method, path, body, headers) {
  const response = await fetch(`${GRAPH}/${path}`, {
    method,
    headers: headers ?? authJson(),
    body,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: response.ok, status: response.status, json };
}

async function uploadProfilePicture() {
  const file = readFileSync(imagePath);
  const fileLength = statSync(imagePath).size;
  const start = await graph(
    "POST",
    `${appId}/uploads?file_name=dental-care-profile.png&file_length=${fileLength}&file_type=image/png`
  );
  if (!start.ok || !start.json.id) {
    throw new Error(`Upload session failed (${start.status}): ${JSON.stringify(start.json)}`);
  }

  const sessionId = start.json.id;
  const finish = await fetch(`${GRAPH}/${sessionId}`, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${token}`,
      file_offset: "0",
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  const finishJson = await finish.json();
  if (!finish.ok || !finishJson.h) {
    throw new Error(`Upload binary failed (${finish.status}): ${JSON.stringify(finishJson)}`);
  }
  return finishJson.h;
}

const about = "Your Smile. Our Passion. Front desk on WhatsApp.";
const address = "128 Harbor View Avenue, Suite 400, Colombo, Western Province 00300, Sri Lanka";
const description =
  "Dental Care Private Hospital — cosmetic, surgical, orthodontic, and family dentistry with hospital-grade sterilization and a calm boutique experience.";

console.log("1) Uploading profile picture…");
const handle = await uploadProfilePicture();
console.log("   handle received");

console.log("2) Updating business profile…");
const profile = await graph("POST", `${phoneNumberId}/whatsapp_business_profile`, JSON.stringify({
  messaging_product: "whatsapp",
  about,
  address,
  description,
  email: "hello@dentalcare.example",
  websites: ["https://instagram.com/dentalcare", "https://facebook.com/dentalcare"],
  vertical: "HEALTH",
  profile_picture_handle: handle,
}));
console.log(`   profile => ${profile.status}`, JSON.stringify(profile.json));

if (!profile.ok && /email/i.test(JSON.stringify(profile.json))) {
  console.log("   retrying profile without email…");
  const retry = await graph("POST", `${phoneNumberId}/whatsapp_business_profile`, JSON.stringify({
    messaging_product: "whatsapp",
    about,
    address,
    description,
    websites: ["https://instagram.com/dentalcare", "https://facebook.com/dentalcare"],
    vertical: "HEALTH",
    profile_picture_handle: handle,
  }));
  console.log(`   profile retry => ${retry.status}`, JSON.stringify(retry.json));
}

console.log("3) Requesting display name 'Dental Care'…");
const name = await graph("POST", phoneNumberId, JSON.stringify({
  new_display_name: "Dental Care",
}));
console.log(`   display name => ${name.status}`, JSON.stringify(name.json));

const check = await graph(
  "GET",
  `${phoneNumberId}?fields=verified_name,name_status,new_display_name,new_name_status,display_phone_number`
);
console.log("4) Name status:", JSON.stringify(check.json));

const live = await graph(
  "GET",
  `${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`
);
console.log("5) Profile:", JSON.stringify(live.json));
