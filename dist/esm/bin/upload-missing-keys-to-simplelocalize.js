#!/usr/bin/env node
import * as fs from "node:fs";
import path from "path";
import { SimplelocalizeBackendApiClientImpl } from "../i18n/vendor/simplelocalize/simplelocalize-backend-api-client.js";
import { Dictionary } from "../i18n/util/dictionary.js";
import { SimplelocalizeMissingKeyStorage } from "../i18n/vendor/simplelocalize/simplelocalize-missing-key-storage.js";
import { OnFallbackLngTextUpdateStrategyImpl } from "../i18n/backend/missing-key-storage";
let missingKeysJson;
try {
    missingKeysJson = fs.readFileSync(path.resolve("./missing-keys.json"), 'utf8');
}
catch (e) {
    console.log("can't load missing-keys.json, exiting...", e.message);
    process.exit(-1);
}
const parsed = JSON.parse(missingKeysJson);
const missing = parsed.missing;
const updated = parsed.updated;
console.log("uploading missing", missing);
const projectToken = process.env.SIMPLELOCALIZE_PROJECT_TOKEN || "n-a";
const apiKey = process.env.SIMPLELOCALIZE_API_KEY || "n-a";
// console.log("projectToken", projectToken, "apiKey", apiKey)
const client = new SimplelocalizeBackendApiClientImpl(apiKey, projectToken, "cdn");
const missingKeysRequests = new Dictionary();
const fallbackLanguageValuesToBeUpdated = new Dictionary();
missing.forEach((m) => {
    missingKeysRequests.set(m[0], m[1]);
});
updated.forEach((m) => {
    fallbackLanguageValuesToBeUpdated.set(m[0], m[1]);
});
async function pushMissingKeysAndUpdatedText() {
    await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, missingKeysRequests, fallbackLanguageValuesToBeUpdated, OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status);
}
await pushMissingKeysAndUpdatedText();
