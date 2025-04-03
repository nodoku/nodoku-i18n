#!/usr/bin/env node
import * as fs from "node:fs";
import path from "path";
import { SimplelocalizeBackendApiClientImpl } from "../i18n/vendor/simplelocalize/simplelocalize-backend-api-client.js";
import { Dictionary } from "../i18n/util/dictionary.js";
import { SimplelocalizeMissingKeyStorage } from "../i18n/vendor/simplelocalize/simplelocalize-missing-key-storage.js";
import { OnFallbackLngTextUpdateStrategyImpl } from "../i18n/backend/missing-key-storage.js";
let missingKeysJson = undefined;
try {
    missingKeysJson = fs.readFileSync(path.resolve("./missing-keys.json"), 'utf8');
}
catch (e) {
    console.log("can't load missing-keys.json, skipping...", e.message);
}
let updatedKeysJson = undefined;
try {
    updatedKeysJson = fs.readFileSync(path.resolve("./updated-keys.json"), 'utf8');
}
catch (e) {
    console.log("can't load updated-keys.json, skipping...", e.message);
}
let existingKeysJson = undefined;
try {
    existingKeysJson = fs.readFileSync(path.resolve("./existing-keys.json"), 'utf8');
}
catch (e) {
    console.log("can't load existing-keys.json, skipping...", e.message);
}
const projectToken = process.env.SIMPLELOCALIZE_PROJECT_TOKEN || "n-a";
const apiKey = process.env.SIMPLELOCALIZE_API_KEY || "n-a";
// console.log("projectToken", projectToken, "apiKey", apiKey)
const client = new SimplelocalizeBackendApiClientImpl(apiKey, projectToken, "cdn");
if (missingKeysJson !== undefined) {
    const missing = JSON.parse(missingKeysJson);
    console.log("processing missing", missing);
    const missingKeysRequests = new Dictionary();
    missing.forEach((m) => {
        missingKeysRequests.set(m[0], m[1]);
    });
    await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, missingKeysRequests);
}
if (updatedKeysJson !== undefined) {
    const updated = JSON.parse(updatedKeysJson);
    console.log("updating keys", updated);
    const fallbackLanguageValuesToBeUpdated = new Dictionary();
    updated.forEach((m) => {
        fallbackLanguageValuesToBeUpdated.set(m[0], m[1]);
    });
    await SimplelocalizeMissingKeyStorage.pushUpdatedKeysForClient(client, fallbackLanguageValuesToBeUpdated, OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status);
}
if (existingKeysJson !== undefined) {
    const existing = JSON.parse(existingKeysJson);
    console.log("processing existing", existing);
    const existingKeysRequests = new Dictionary();
    existing.forEach((m) => {
        existingKeysRequests.set(m[0], m[1]);
    });
    await SimplelocalizeMissingKeyStorage.removeUnusedKeysForClient(client, existingKeysRequests);
}
