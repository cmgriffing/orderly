import React, { ChangeEvent, useRef, useState } from "react";
import Case from "case";
import { loadRemote } from "./whisper-extras/helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Module: any;

import "./Demo.css";

function setAudio(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  audio: Float32Array | null
) {
  //if (audio) {
  //    // convert to 16-bit PCM
  //    var blob = new Blob([audio], { type: 'audio/wav' });
  //    var url = URL.createObjectURL(blob);
  //    document.getElementById('source').src = url;
  //    document.getElementById('audio').hidden = false;
  //    document.getElementById('audio').loop = false;
  //    document.getElementById('audio').load();
  //} else {
  //    document.getElementById('audio').hidden = true;
  //}
}

const urls = {
  "tiny.en": "/models/tiny.en.bin",
  tiny: "/models/tiny.bin",
  "base.en": "/models/base.en.bin",
  base: "/models/base.bin",
  "small.en": "/models/small.en.bin",
  small: "/models/small.bin",

  "tiny-en-q5_1": "/models/tiny.en-q5_1.bin",
  "tiny-q5_1": "/models/tiny-q5_1.bin",
  "base-en-q5_1": "/models/base.en-q5_1.bin",
  "base-q5_1": "/models/base-q5_1.bin",
  "small-en-q5_1": "/models/small.en-q5_1.bin",
  "small-q5_1": "/models/small-q5_1.bin",
  "medium-en-q5_0": "/models/medium.en-q5_0.bin",
  "medium-q5_0": "/models/medium-q5_0.bin",
  "large-q5_0": "/models/large-q5_0.bin",
};

const sizes = {
  "tiny.en": 75,
  tiny: 75,
  "base.en": 142,
  base: 142,
  "small.en": 466,
  small: 466,

  "tiny-en-q5_1": 31,
  "tiny-q5_1": 31,
  "base-en-q5_1": 57,
  "base-q5_1": 57,
  "small-en-q5_1": 182,
  "small-q5_1": 182,
  "medium-en-q5_0": 515,
  "medium-q5_0": 515,
  "large-q5_0": 1030,
};

interface ModelOption {
  label: string;
  value: keyof typeof urls;
}

const modelOptions: ModelOption[] = [
  {
    label: "tiny.en (75 MB)",
    value: "tiny.en",
  },
  {
    label: "tiny (75 MB)",
    value: "tiny.en",
  },
  {
    label: "base.en (142 MB)",
    value: "base.en",
  },
  {
    label: "base (142 MB)",
    value: "base",
  },
  {
    label: "small.en (466 MB)",
    value: "small.en",
  },
  {
    label: "small (466 MB)",
    value: "small",
  },
];

const quantizedModelOptions: ModelOption[] = [
  {
    label: "tiny.en (Q5_1, 31 MB)",
    value: "tiny-en-q5_1",
  },
  {
    label: "tiny (Q5_1, 31 MB)",
    value: "tiny-q5_1",
  },

  {
    label: "base.en (Q5_1, 57 MB)",
    value: "base-en-q5_1",
  },
  {
    label: "base (Q5_1, 57 MB)",
    value: "base-q5_1",
  },

  {
    label: "small.en (Q5_1, 182 MB)",
    value: "small-en-q5_1",
  },
  {
    label: "small.en (Q5_1, 182 MB)",
    value: "small-en-q5_1",
  },

  {
    label: "medium.en (Q5_0, 515 MB)",
    value: "medium-en-q5_0",
  },
  {
    label: "medium.en (Q5_0, 515 MB)",
    value: "medium-en-q5_0",
  },

  {
    label: "large (Q5_0, 1030 MB)",
    value: "large-q5_0",
  },
];

export function Demo() {
  const [selectedInputType, setSelectedInputType] = useState<"file" | "mic">(
    "file"
  );
  const [selectedFile, setSelectedFile] = useState<File>();
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [progress, setProgress] = useState(0);
  const [modelWhisperStatus, setModelWhisperStatus] = useState("");
  const [modelWhisperResult, setModelWhisperResult] = useState("");

  const [history, setHistory] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [threads, setThreads] = useState(8);

  const instance = useRef<object>();
  const audio = useRef<Float32Array | null>();
  const context = useRef<AudioContext>();

  function printTextarea(text: string, ...rest: string[]) {
    if (arguments.length > 1) {
      text = Array.prototype.slice.call([text, ...rest]).join(" ");
    }
    console.log(text);
    setHistory((oldHistory) => {
      return oldHistory.concat([text]);
    });
  }

  let model_whisper = "";

  //
  // load model
  //

  function storeFS(fname: string, buf: Uint8Array) {
    // write to WASM file using FS_createDataFile
    // if the file exists, delete it
    try {
      Module.FS_unlink(fname);
    } catch (e) {
      // ignore
    }

    Module.FS_createDataFile("/", fname, buf, true, true);

    model_whisper = fname;

    setModelWhisperStatus(`loaded "${model_whisper}"!`);

    printTextarea("storeFS: stored model: " + fname + " size: " + buf.length);
    setModelWhisperResult("Model fetched: " + model_whisper);
  }

  function loadFile(event: React.ChangeEvent<HTMLInputElement>, fname: string) {
    const file = event.target.files?.[0] || null;
    if (file == null) {
      return;
    }

    setSelectedFile(file);

    printTextarea(
      "loadFile: loading model: " +
        file.name +
        ", size: " +
        file.size +
        " bytes"
    );
    printTextarea("loadFile: please wait ...");

    const reader = new FileReader();
    reader.onload = function () {
      if (reader.result instanceof ArrayBuffer) {
        const buf = new Uint8Array(reader.result);
        storeFS(fname, buf);
      }
    };
    reader.readAsArrayBuffer(file);

    setModelWhisperStatus("loaded model: " + file.name);
  }

  function loadWhisper(model: keyof typeof urls) {
    const url = urls[model];
    const dst = "whisper.bin";
    const size_mb = sizes[model];

    model_whisper = model;

    setModelWhisperStatus("loading model: " + model);

    const cbProgress = function (p: number) {
      setProgress(p * 100);
    };

    const cbCancel = function () {
      setModelWhisperStatus("");
    };

    loadRemote(url, dst, size_mb, cbProgress, storeFS, cbCancel, printTextarea);
  }

  //
  // audio file
  //

  const kMaxAudio_s = 30 * 60;
  const kMaxRecording_s = 2 * 60;
  const kSampleRate = 16000;

  function loadAudio(event: React.ChangeEvent<HTMLInputElement>) {
    if (!context.current) {
      context.current = new AudioContext({
        sampleRate: kSampleRate,
        // hmm, these dont seem to be here. might be webkit only?
        // channelCount: 1,
        // echoCancellation: false,
        // autoGainControl: true,
        // noiseSuppression: true,
      });
    }

    const file = event.target.files?.[0] || null;
    if (file == null) {
      return;
    }

    printTextarea(
      "js: loading audio: " + file.name + ", size: " + file.size + " bytes"
    );
    printTextarea("js: please wait ...");

    const reader = new FileReader();
    reader.onload = function () {
      if (reader.result instanceof ArrayBuffer) {
        const buf = new Uint8Array(reader.result);

        context.current?.decodeAudioData(
          buf.buffer,
          function (audioBuffer: AudioBuffer) {
            const offlineContext = new OfflineAudioContext(
              audioBuffer.numberOfChannels,
              audioBuffer.length,
              audioBuffer.sampleRate
            );
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start(0);

            offlineContext.startRendering().then(function (renderedBuffer) {
              audio.current = renderedBuffer.getChannelData(0);
              printTextarea("js: audio loaded, size: " + audio.current.length);

              // truncate to first 30 seconds
              if (audio.current.length > kMaxAudio_s * kSampleRate) {
                audio.current = audio.current.slice(
                  0,
                  kMaxAudio_s * kSampleRate
                );
                printTextarea(
                  "js: truncated audio to first " + kMaxAudio_s + " seconds"
                );
              }

              setAudio(audio.current);
            });
          },
          function (e) {
            printTextarea("js: error decoding audio: " + e);
            audio.current = null;
            setAudio(audio.current);
          }
        );
      }
    };
    reader.readAsArrayBuffer(file);
  }

  //
  // microphone
  //

  let mediaRecorder: MediaRecorder | null = null;
  let doRecording = false;
  let startTime = 0;

  function stopRecording() {
    doRecording = false;
  }

  // record up to kMaxRecording_s seconds of audio from the microphone
  // check if doRecording is false every 1000 ms and stop recording if so
  // update progress information
  function startRecording() {
    if (!context.current) {
      context.current = new AudioContext({
        sampleRate: kSampleRate,
        // channelCount: 1,
        // echoCancellation: false,
        // autoGainControl: true,
        // noiseSuppression: true,
      });
    }

    setIsRecording(true);
    setProgress(0);

    doRecording = true;
    startTime = Date.now();

    let chunks: BlobPart[] = [];
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(function (s) {
        stream = s;
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) {
          chunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
          const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
          chunks = [];

          setIsRecording(false);

          const reader = new FileReader();
          reader.onload = function () {
            if (reader.result instanceof ArrayBuffer) {
              const buf = new Uint8Array(reader.result);

              context.current?.decodeAudioData(
                buf.buffer,
                function (audioBuffer: AudioBuffer) {
                  const offlineContext = new OfflineAudioContext(
                    audioBuffer.numberOfChannels,
                    audioBuffer.length,
                    audioBuffer.sampleRate
                  );
                  const source = offlineContext.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(offlineContext.destination);
                  source.start(0);

                  offlineContext
                    .startRendering()
                    .then(function (renderedBuffer) {
                      audio.current = renderedBuffer.getChannelData(0);
                      printTextarea(
                        "js: audio recorded, size: " + audio.current.length
                      );

                      // truncate to first 30 seconds
                      if (
                        audio.current.length >
                        kMaxRecording_s * kSampleRate
                      ) {
                        audio.current = audio.current.slice(
                          0,
                          kMaxRecording_s * kSampleRate
                        );
                        printTextarea(
                          "js: truncated audio to first " +
                            kMaxRecording_s +
                            " seconds"
                        );
                      }
                      setAudio(audio.current);
                    });
                },
                function (e) {
                  printTextarea("js: error decoding audio: " + e);
                  audio.current = null;
                  setAudio(audio.current);
                }
              );
            }
          };

          reader.readAsArrayBuffer(blob);
        };
        mediaRecorder.start();
      })
      .catch(function (err) {
        printTextarea("js: error getting audio stream: " + err);
      });

    const interval = setInterval(function () {
      if (!doRecording && mediaRecorder && stream) {
        clearInterval(interval);
        mediaRecorder.stop();
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      } else {
        console.log("Not stopping track", {
          doRecording,
          mediaRecorder,
          stream,
        });
      }

      setProgress(
        parseInt(
          ((100 * (Date.now() - startTime)) / 1000 / kMaxRecording_s).toFixed(0)
        )
      );
    }, 1000);

    printTextarea("js: recording ...");

    setTimeout(function () {
      if (doRecording) {
        printTextarea(
          "js: recording stopped after " + kMaxRecording_s + " seconds"
        );
        stopRecording();
      }
    }, kMaxRecording_s * 1000);
  }

  //
  // transcribe
  //

  const nthreads = 8;

  function changeThreads(value: number) {
    setThreads(value);
  }

  function onProcess(translate: boolean) {
    if (!instance.current) {
      instance.current = Module.init("whisper.bin");

      if (instance.current) {
        printTextarea("js: whisper initialized, instance: " + instance.current);
        setModelWhisperResult("Model loaded: " + model_whisper);
      }
    }

    if (!instance.current) {
      printTextarea("js: failed to initialize whisper");
      return;
    }

    if (!audio) {
      printTextarea("js: no audio data");
      return;
    }

    if (instance.current) {
      printTextarea("");
      printTextarea("js: processing - this might take a while ...");
      printTextarea("");

      setTimeout(function () {
        const ret = Module.full_default(
          instance.current,
          audio,
          selectedLanguage,
          nthreads,
          translate
        );
        console.log("js: full_default returned: " + ret);
        if (ret) {
          printTextarea("js: whisper returned: " + ret);
        }
      }, 100);
    }
  }

  return (
    <div id="main-container">
      <b>
        Minimal{" "}
        <a href="https://github.com/ggerganov/whisper.cpp">whisper.cpp</a>{" "}
        example running fully in the browser
      </b>
      <br />
      Usage instructions:
      <br />
      <ul>
        <li>
          Load a ggml model file (you can obtain one from{" "}
          <a href="https://ggml.ggerganov.com/">here</a>, recommended:{" "}
          <b>tiny</b> or <b>base</b>)
        </li>
        <li>
          Select audio file to transcribe or record audio from the microphone
          (sample: <a href="/models/jfk.wav">jfk.wav</a>)
        </li>
        <li>Click on the "Transcribe" button to start the transcription</li>
      </ul>
      Note that the computation is quite heavy and may take a few seconds to
      complete.
      <br />
      The transcription results will be displayed in the text area below.
      <br />
      <br />
      <b>Important:</b>
      <ul>
        <li>
          your browser must support WASM SIMD instructions for this to work
        </li>
        <li>
          Firefox cannot load files larger than 256 MB - use Chrome instead
        </li>
      </ul>
      <b>More examples:</b>
      <a href="/models/">main</a> |<a href="/models/bench">bench</a> |
      <a href="/models/stream">stream</a> |<a href="/models/command">command</a>{" "}
      |<a href="/models/talk">talk</a> |
      <hr />
      <div hidden={modelWhisperResult !== ""}>
        Whisper models:{" "}
        <span id="model-whisper-status">{modelWhisperStatus}</span>
        <br />
        <br />
        <input
          type="file"
          id="whisper-file"
          name="file"
          hidden={!!selectedFile}
          onChange={(event) => {
            loadFile(event, "whisper.bin");
          }}
        />
        {modelOptions.map((option) => (
          <button
            id={`fetch-whisper-${Case.kebab(option.value)}`}
            onClick={() => {
              loadWhisper(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
        <br />
        <br />
        Quantized models:
        <br />
        <br />
        {quantizedModelOptions.map((option) => (
          <button
            id={`fetch-whisper-${Case.kebab(option.value)}`}
            onClick={() => {
              loadWhisper(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
        <span id="fetch-whisper-progress"></span>
      </div>
      <div hidden={modelWhisperResult === ""}>{modelWhisperResult}</div>
      <br />
      <div id="input">
        Input:
        <input
          type="radio"
          id="file"
          name="input"
          value="file"
          checked={selectedInputType === "file"}
          onChange={() => {
            setSelectedInputType("file");
          }}
        />{" "}
        <label htmlFor="file">File</label>
        <input
          type="radio"
          id="mic"
          name="input"
          value="mic"
          checked={selectedInputType === "mic"}
          onChange={() => {
            setSelectedInputType("mic");
          }}
        />{" "}
        <label htmlFor="mic">Microphone</label>
      </div>
      <br />
      <div id="input_file" hidden={selectedInputType != "file"}>
        Audio file:
        <input
          type="file"
          id="file"
          name="file"
          onChange={(event) => {
            loadAudio(event);
          }}
        />
      </div>
      <div id="input_mic" hidden={selectedInputType != "mic"}>
        Microphone:
        <button
          onClick={() => {
            startRecording();
          }}
          disabled={isRecording}
        >
          Start
        </button>
        <button
          disabled={!isRecording}
          onClick={() => {
            stopRecording();
          }}
        >
          Stop
        </button>
        <br />
        <br />
        <div id="progress" hidden={progress === 0}>
          <div
            id="progress-bar"
            style={{
              width: `${progress}%`,
            }}
          ></div>
          <div id="progress-text">{progress}%</div>
        </div>
      </div>
      <audio controls={true} id="audio" loop hidden>
        Your browser does not support the &lt;audio&gt; tag.
        <source id="source" src="" type="audio/wav" />
      </audio>
      <hr />
      <br />
      <table>
        <tr>
          <td>
            Language:
            <select
              id="language"
              name="language"
              onChange={(event) => {
                setSelectedLanguage(event.currentTarget.value);
              }}
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="hy">Armenian</option>
              <option value="az">Azerbaijani</option>
              <option value="eu">Basque</option>
              <option value="be">Belarusian</option>
              <option value="bn">Bengali</option>
              <option value="bg">Bulgarian</option>
              <option value="ca">Catalan</option>
              <option value="zh">Chinese</option>
              <option value="hr">Croatian</option>
              <option value="cs">Czech</option>
              <option value="da">Danish</option>
              <option value="nl">Dutch</option>
              <option value="en">English</option>
              <option value="et">Estonian</option>
              <option value="tl">Filipino</option>
              <option value="fi">Finnish</option>
              <option value="fr">French</option>
              <option value="gl">Galician</option>
              <option value="ka">Georgian</option>
              <option value="de">German</option>
              <option value="el">Greek</option>
              <option value="gu">Gujarati</option>
              <option value="iw">Hebrew</option>
              <option value="hi">Hindi</option>
              <option value="hu">Hungarian</option>
              <option value="is">Icelandic</option>
              <option value="id">Indonesian</option>
              <option value="ga">Irish</option>
              <option value="it">Italian</option>
              <option value="ja">Japanese</option>
              <option value="kn">Kannada</option>
              <option value="ko">Korean</option>
              <option value="la">Latin</option>
              <option value="lv">Latvian</option>
              <option value="lt">Lithuanian</option>
              <option value="mk">Macedonian</option>
              <option value="ms">Malay</option>
              <option value="mt">Maltese</option>
              <option value="no">Norwegian</option>
              <option value="fa">Persian</option>
              <option value="pl">Polish</option>
              <option value="pt">Portuguese</option>
              <option value="ro">Romanian</option>
              <option value="ru">Russian</option>
              <option value="sr">Serbian</option>
              <option value="sk">Slovak</option>
              <option value="sl">Slovenian</option>
              <option value="es">Spanish</option>
              <option value="sw">Swahili</option>
              <option value="sv">Swedish</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="th">Thai</option>
              <option value="tr">Turkish</option>
              <option value="uk">Ukrainian</option>
              <option value="ur">Urdu</option>
              <option value="vi">Vietnamese</option>
              <option value="cy">Welsh</option>
              <option value="yi">Yiddish</option>
            </select>
          </td>
          <td>
            Threads:
            <input
              type="range"
              id="threads"
              name="threads"
              min="1"
              max="16"
              value={threads}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                changeThreads(parseInt(event.currentTarget.value || "8"));
              }}
            />
            <span id="threads-value">{threads}</span>
          </td>
          <td>
            <button
              onClick={() => {
                onProcess(false);
              }}
            >
              Transcribe
            </button>
          </td>
          <td>
            <button
              onClick={() => {
                onProcess(true);
              }}
            >
              Translate
            </button>
          </td>
        </tr>
      </table>
      <br />
      <textarea id="output" rows={20} value={history.join("\n")}></textarea>
      <br />
      <br />
      <div className="cell-version">
        <span>
          | Build time: <span className="nav-link">@GIT_DATE@</span> | Commit
          hash:{" "}
          <a
            className="nav-link"
            href="https://github.com/ggerganov/whisper.cpp/commit/@GIT_SHA1@"
          >
            @GIT_SHA1@
          </a>{" "}
          | Commit subject:{" "}
          <span className="nav-link">@GIT_COMMIT_SUBJECT@</span> |
          <a
            className="nav-link"
            href="https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm"
          >
            Source Code
          </a>{" "}
          |
        </span>
      </div>
    </div>
  );
}
