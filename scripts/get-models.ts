import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urls = {
  "tiny.en": "https://whisper.ggerganov.com/ggml-model-whisper-tiny.en.bin",
  tiny: "https://whisper.ggerganov.com/ggml-model-whisper-tiny.bin",
  "base.en": "https://whisper.ggerganov.com/ggml-model-whisper-base.en.bin",
  base: "https://whisper.ggerganov.com/ggml-model-whisper-base.bin",
  "small.en": "https://whisper.ggerganov.com/ggml-model-whisper-small.en.bin",
  small: "https://whisper.ggerganov.com/ggml-model-whisper-small.bin",

  "tiny-en-q5_1":
    "https://whisper.ggerganov.com/ggml-model-whisper-tiny.en-q5_1.bin",
  "tiny-q5_1": "https://whisper.ggerganov.com/ggml-model-whisper-tiny-q5_1.bin",
  "base-en-q5_1":
    "https://whisper.ggerganov.com/ggml-model-whisper-base.en-q5_1.bin",
  "base-q5_1": "https://whisper.ggerganov.com/ggml-model-whisper-base-q5_1.bin",
  "small-en-q5_1":
    "https://whisper.ggerganov.com/ggml-model-whisper-small.en-q5_1.bin",
  "small-q5_1":
    "https://whisper.ggerganov.com/ggml-model-whisper-small-q5_1.bin",
  "medium-en-q5_0":
    "https://whisper.ggerganov.com/ggml-model-whisper-medium.en-q5_0.bin",
  "medium-q5_0":
    "https://whisper.ggerganov.com/ggml-model-whisper-medium-q5_0.bin",
  "large-q5_0":
    "https://whisper.ggerganov.com/ggml-model-whisper-large-q5_0.bin",
};

const modelsDir = path.resolve(__dirname, "..", "public/models");

await Promise.all(
  Object.entries(urls).map(([key, url]) => {
    return fetch(url)
      .then((res) => {
        return res.arrayBuffer();
      })
      .then((buffer) => {
        fs.writeFileSync(
          `${modelsDir}/${key}.bin`,
          Buffer.from(buffer, "binary")
        );
      });
  })
);
