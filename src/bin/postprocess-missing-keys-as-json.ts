#!/usr/bin/env node

import * as fs from "node:fs";
import path from "path";
import {Dictionary, TranslationKey, UpdatedKey} from "../i18n/util/dictionary.js";


// let finished: boolean = false;

const fileToLinesBuffered = (filePath: string, onLineRead: (line: string) => void, onStreamEnd: () => void): void => {

    if (!fs.existsSync(filePath)) {
        console.log("file not found" + filePath);
        return;
    }

    var remaining: string = ""

    fs.createReadStream(filePath)
        .on('data', function (chunk) {
            console.log(`data ${filePath} line: ` + chunk.toString());
            var ls: string[] = (remaining + chunk.toString()).split(/\r?\n/);
            remaining = ls[ls.length - 1];
            ls.slice(0, ls.length - 1).forEach(onLineRead);
        })
        .on('error', (error) => {
            console.error('Error reading file:', error);
        })
        .on('end', () => {
            console.log('File read complete');
            remaining.split(/\r?\n/).forEach(onLineRead);
            onStreamEnd();
        });


    // const stream: fs.ReadStream = fs.createReadStream(filePath, {encoding: 'utf8', flags: "a+", autoClose: true, emitClose: true});
    // stream.pause();
    // console.log("stream.isPaused()", stream.isPaused())
    //
    // var chunk: string;
    // while (chunk = stream.read()) {
    //     var ls: string[] = (remaining + chunk.toString()).split(/\r?\n/);
    //     remaining = ls[ls.length - 1];
    //     ls.slice(0, ls.length - 1).forEach(onLineRead);
    // }
    // remaining.split(/\r?\n/).forEach(onLineRead);

    // stream.on('data', (chunk: string | Buffer) => {
    //     console.log(chunk);
    //     var ls: string[] = chunk.toString().split(/\r?\n/);
    //     if (!chunk.toString().endsWith(/\r?\n/))
    // });
    //
    // stream.on('error', (error) => {
    //     console.error('Error reading file:', error);
    // });
    //
    // stream.on('end', () => {
    //     console.log('File read complete');
    // });

}

const processUpdatedKeyLine = (csvLine: string): [UpdatedKey, string] | undefined => {
    const chunks: string[] = csvLine.split(",")
    if (!csvLine || csvLine.length === 0) {
        return undefined;
    }
    return  [{language: chunks[0], namespace: chunks[1], key: chunks[2]}, fromBase64(chunks[3])];
}

const processTranslationKeyLine = (csvLine: string): [TranslationKey, string] | undefined => {
    const chunks: string[] = csvLine.split(",")
    if (!csvLine || csvLine.length === 0) {
        return undefined;
    }
    return  [{namespace: chunks[0], key: chunks[1]}, chunks[2]];
}

function dumpToFile<TKey>(p: string, dict: Dictionary<TKey, string>) {
    fs.writeFileSync(path.resolve(p), JSON.stringify(dict.entries()));
}

function fromBase64(strBase64: string): string {
    if (!strBase64) {
        return strBase64;
    }
    return Buffer.from(strBase64, 'base64').toString('ascii')
}

const existingKeysRequests: Dictionary<TranslationKey, string> = new Dictionary<TranslationKey, string>();
const missingKeysRequests: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();
const fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();


fileToLinesBuffered("./missing-keys.csv", l => {
    const k: [UpdatedKey, string] | undefined = processUpdatedKeyLine(l);
    if (k && !missingKeysRequests.has(k[0])) {
        missingKeysRequests.set(k[0], k[1]);
    }
}, () => dumpToFile("./missing-keys.json", missingKeysRequests))

fileToLinesBuffered("./updated-keys.csv", l => {
    const k: [UpdatedKey, string] | undefined = processUpdatedKeyLine(l);
    if (k && !fallbackLanguageValuesToBeUpdated.has(k[0])) {
        fallbackLanguageValuesToBeUpdated.set(k[0], k[1]);
    }
}, () => dumpToFile("./updated-keys.json", fallbackLanguageValuesToBeUpdated))

fileToLinesBuffered("./existing-keys.csv", l => {
    const k: [TranslationKey, string] | undefined = processTranslationKeyLine(l);
    if (k && !existingKeysRequests.has(k[0])) {
        existingKeysRequests.set(k[0], "exists");
    }
}, () => dumpToFile("./existing-keys.json", existingKeysRequests))



