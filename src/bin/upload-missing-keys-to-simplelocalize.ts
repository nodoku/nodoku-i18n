#!/usr/bin/env node

import * as fs from "node:fs";
import path from "path";
import {SimplelocalizeBackendApiClientImpl} from "../i18n/vendor/simplelocalize/simplelocalize-backend-api-client.js";
import {UpdatedKey, Dictionary} from "../i18n/util/dictionary.js";
import {SimplelocalizeMissingKeyStorage} from "../i18n/vendor/simplelocalize/simplelocalize-missing-key-storage.js";
import {OnFallbackLngTextUpdateStrategyImpl} from "../i18n/backend/missing-key-storage.js";
import {TranslationKey} from "../i18n/util/dictionary.js";


let missingKeysJson = undefined;
try {
    missingKeysJson = fs.readFileSync(path.resolve("./missing-keys.json"), 'utf8');
} catch (e: any) {
    console.log("can't load missing-keys.json, skipping...", e.message)
}

let updatedKeysJson = undefined;
try {
    updatedKeysJson = fs.readFileSync(path.resolve("./updated-keys.json"), 'utf8');
} catch (e: any) {
    console.log("can't load updated-keys.json, skipping...", e.message)
}

let existingKeysJson = undefined
try {
    existingKeysJson = fs.readFileSync(path.resolve("./existing-keys.json"), 'utf8');
} catch (e: any) {
    console.log("can't load existing-keys.json, skipping...", e.message)
}

const projectToken: string = process.env.SIMPLELOCALIZE_PROJECT_TOKEN || "n-a";
const apiKey: string = process.env.SIMPLELOCALIZE_API_KEY || "n-a";

// console.log("projectToken", projectToken, "apiKey", apiKey)

const client: SimplelocalizeBackendApiClientImpl = new SimplelocalizeBackendApiClientImpl(apiKey, projectToken, "cdn");



if (missingKeysJson !== undefined) {
    const missing = JSON.parse(missingKeysJson);
    console.log("processing missing", missing);
    const missingKeysRequests: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();
    missing.forEach((m: any[]) => {
        missingKeysRequests.set(m[0] as UpdatedKey, m[1]);
    })

    await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, missingKeysRequests);
}

if (updatedKeysJson !== undefined) {
    const updated = JSON.parse(updatedKeysJson);
    console.log("updating keys", updated);
    const fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();
    updated.forEach((m: any[]) => {
        fallbackLanguageValuesToBeUpdated.set(m[0] as UpdatedKey, m[1]);
    })

    await SimplelocalizeMissingKeyStorage.pushUpdatedKeysForClient(client, fallbackLanguageValuesToBeUpdated,
        OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status);
}

if (existingKeysJson !== undefined) {
    const existing = JSON.parse(existingKeysJson);
    console.log("processing existing", existing);
    const existingKeysRequests: Dictionary<TranslationKey, string> = new Dictionary<TranslationKey, string>();
    existing.forEach((m: any[]) => {
        existingKeysRequests.set(m[0] as TranslationKey, m[1]);
    })

    await SimplelocalizeMissingKeyStorage.removeUnusedKeysForClient(client, existingKeysRequests);
}
