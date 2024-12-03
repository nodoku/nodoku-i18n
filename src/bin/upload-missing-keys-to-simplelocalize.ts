#!/usr/bin/env node

import * as fs from "node:fs";
import path from "path";
import {SimplelocalizeBackendApiClient, OnFallbackLngTextUpdateStrategyImpl} from "../i18n/vendor/simplelocalize/simplelocalize-backend-api-client.js";
import {UpdatedKey, Dictionary} from "../i18n/util/dictionary.js";
import {SimplelocalizeMissingKeyStorage} from "../i18n/vendor/simplelocalize/simplelocalize-missing-key-storage.js";


let missingKeysJson
try {
    missingKeysJson = fs.readFileSync(path.resolve("./missing-keys.json"), 'utf8');
} catch (e: any) {

    console.log("can't load missing-keys.json, exiting...", e.message)
    process.exit(-1);
}


const parsed = JSON.parse(missingKeysJson);

const missing = parsed.missing;
const updated = parsed.updated;

console.log("uploading missing", missing);

const projectToken: string = process.env.SIMPLELOCALIZE_PROJECT_TOKEN || "n-a";
const apiKey: string = process.env.SIMPLELOCALIZE_API_KEY || "n-a";

console.log("projectToken", projectToken, "apiKey", apiKey)

const client = new SimplelocalizeBackendApiClient(apiKey, projectToken, "cdn");

const missingKeysRequests: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();
const fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();


missing.forEach((m: any[]) => {
    missingKeysRequests.set(m[0] as UpdatedKey, m[1]);
})

updated.forEach((m: any[]) => {
    fallbackLanguageValuesToBeUpdated.set(m[0] as UpdatedKey, m[1]);
})

async function pushMissingKeysAndUpdatedText() {

    await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, missingKeysRequests, fallbackLanguageValuesToBeUpdated,
        OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status);
}

await pushMissingKeysAndUpdatedText();

