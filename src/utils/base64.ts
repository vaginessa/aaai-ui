import { decode as imageJsDecode } from "image-js";
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let isDataURL = /^data:[a-z]+\/(?:[a-z]+);base64,/;

// Use a lookup table to find the index.
let lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

export function encode(bytes) {
  let i;
  let len = bytes.length;
  let base64 = '';

  for (i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    base64 += chars[bytes[i + 2] & 63];
  }

  if (len % 3 === 2) {
    base64 = `${base64.substring(0, base64.length - 1)}=`;
  } else if (len % 3 === 1) {
    base64 = `${base64.substring(0, base64.length - 2)}==`;
  }

  return base64;
}

export function decode(base64) {
    let bufferLength = base64.length * 0.75;
    let len = base64.length;
    let p = 0;
    let encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
        bufferLength--;
        }
    }

    const bytes = new Uint8Array(bufferLength);

    for (let i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return bytes;
}

export function loadURL(url: string) {
    const dataURL = url.slice(0, 64).match(isDataURL);

    let binaryDataP;
    if (dataURL !== null) {
        binaryDataP = Promise.resolve(decode(url.slice(dataURL[0].length)));
    } else {
        binaryDataP = fetchBinary(url);
    }
    return binaryDataP.then((binaryData) => {
        const uint8 = new Uint8Array(binaryData);
        return imageJsDecode(uint8);
    });
}

export function fetchBinary(url: string, { withCredentials = false } = {}) {
    return new Promise(function (resolve, reject) {
        let xhr = new self.XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.withCredentials = withCredentials;

        xhr.onload = function (e) {
            if (this.status !== 200) reject(e);
            else resolve(this.response);
        };
        xhr.onerror = reject;
        xhr.send();
    });
}

export function toBase64URL(u8, type) {
  const base64 = encode(u8);
  return `data:${type};base64,${base64}`;
}

/**
 * Converts base64 data into a blob
 * @param base64Image Base64 data to convert into a BLOB
 */
export function convertBase64ToBlob(base64Image: string, contentType?: string) {
    // Split into two parts
    const parts = base64Image.split(';base64,');

    // Hold the content type
    const imageType = contentType ?? parts[0].split(':')[1];

    // Decode Base64 string
    const decodedData = window.atob(parts[1]);

    // Create UNIT8ARRAY of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);

    // Insert all character code into uInt8Array
    for (let i = 0; i < decodedData.length; ++i) {
        uInt8Array[i] = decodedData.charCodeAt(i);
    }

    // Return BLOB image after conversion
    return new Blob([uInt8Array], { type: imageType });
}

/**
 * Converts a blob/file into base64 data 
 * @param data Blob/file to convert into base64
 */
export function convertToBase64(data: Blob | File) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error);
        reader.readAsDataURL(data);
    })
}
