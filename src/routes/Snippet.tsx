import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  TextInput,
  Textarea,
  Flex,
  Group,
  Button,
  Box,
  Modal,
  Text,
  Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import {
  currentSnippet,
  currentSnippetId,
  fetchTimestamp,
  whisperInstance,
} from "../state/main";
import { SnippetsCRUD } from "../data/repositories/snippets";
import { IconMicrophone, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target) {
        resolve(e.target.result as string);
      } else {
        reject(e);
      }
    };
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsDataURL(blob);
  });
}

export function Snippet() {
  const { snippetId: rawSnippetId } = useParams();
  const snippetId = parseInt(rawSnippetId || "-1");
  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [, setCurrentSnippetId] = useAtom(currentSnippetId);
  const [snippet] = useAtom(currentSnippet);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [whisper] = useAtom(whisperInstance);
  const [audio, setAudio] = useState<Float32Array>(new Float32Array());
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [audioString, setAudioString] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const [{ start: startRecording, stop: stopRecording }, setMicrophone] =
    useState({
      start: () => {},
      stop: () => {},
    });

  useEffect(() => {
    setMicrophone(
      getMicrophone({
        startedCallback: () => {
          setIsRecording(true);
        },
        userMediaErrorCallback: () => {
          setIsRecording(false);
        },
        finishedCallback: async (newAudio, newAudioBlob) => {
          setIsRecording(false);
          console.log({ newAudio });
          setAudio(newAudio);
          setAudioBlob(newAudioBlob);
          const result = await whisper?.processAudio(newAudio);

          console.log({ result });
        },
      })
    );
  }, [whisper]);

  useEffect(() => {
    async function inner() {
      if (audio.length > 0 && audioBlob) {
        const url = await blobToDataURL(audioBlob);
        console.log({ url });
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        setAudioString(url);
      }
    }

    inner();
  }, [audio, audioBlob]);

  useEffect(() => {
    async function listener(e: any) {
      console.log("resultEvent", e, e.detail);

      if (contentRef.current) {
        contentRef.current.value = e.detail;
      }

      await SnippetsCRUD.update(snippetId, {
        content: e.detail,
      });
      setFetchTimestamp(Date.now());
    }

    window.addEventListener("whisperResult", listener);

    return () => {
      window.removeEventListener("whisperResult", listener);
    };
  }, [snippetId, setFetchTimestamp]);

  useEffect(() => {
    if (isRecording) {
      const recordingStartedAt = Date.now();
      setRecordingDuration(0);

      const recordingInterval = setInterval(() => {
        setRecordingDuration(
          Math.floor((Date.now() - recordingStartedAt) / 1000)
        );
      }, 1000);

      return () => {
        clearInterval(recordingInterval);
      };
    }
  }, [isRecording]);

  const [
    recordingModalOpened,
    { open: openRecordingModal, close: closeRecordingModal },
  ] = useDisclosure(false);

  useEffect(() => {
    setCurrentSnippetId(snippetId);
  }, [snippetId, setCurrentSnippetId]);

  return (
    <>
      <Flex direction={"column"} w="100%" maw={"600px"} mx={"auto"} px={24}>
        <Box>
          <Box>Created At: {dayjs(snippet?.createdAt).fromNow()}</Box>
          <Box>Modified At: {dayjs(snippet?.modifiedAt).fromNow()}</Box>
          {!!snippet?.recordedAt && (
            <Box>Recorded At: {dayjs(snippet?.recordedAt).fromNow()}</Box>
          )}
          {!!snippet?.recordedAt && (
            <Box>Processed At: {dayjs(snippet?.processedAt).fromNow()}</Box>
          )}
          {!!snippet?.recordedAt && (
            <Box>Finished At: {dayjs(snippet?.finishedAt).fromNow()}</Box>
          )}
        </Box>

        <TextInput
          label="Label"
          defaultValue={snippet?.label}
          onChange={async (e) => {
            if (snippet) {
              await SnippetsCRUD.update(snippet?.id, {
                label: e.currentTarget.value,
              });
              setFetchTimestamp(Date.now());
            }
          }}
        />
        <Textarea
          ref={contentRef}
          defaultValue={snippet?.content}
          label="Content"
          onInput={async (e) => {
            await SnippetsCRUD.update(snippetId, {
              content: e.currentTarget.value,
            });
            setFetchTimestamp(Date.now());
          }}
        />

        <Group mt={8} justify="space-between">
          <Button
            color="red"
            variant="outline"
            onClick={() => {
              openRecordingModal();
              startRecording();
            }}
          >
            Record Audio
            <IconMicrophone />
          </Button>
          <Button color="red">
            Delete <IconTrash />
          </Button>
        </Group>
        <Modal
          opened={recordingModalOpened}
          closeOnClickOutside={false}
          closeOnEscape={false}
          withCloseButton={false}
          onClose={() => {
            // we shouldn't actually be able to get to here
            closeRecordingModal();
          }}
          centered
          size="auto"
          padding={24}
        >
          <Flex direction="column" align="center" justify="center" gap={20}>
            <Flex align="center" justify="center" gap={12}>
              <Text size="xl" fw="bold">
                Recording
              </Text>
              <Loader color="red" />
            </Flex>
            {isRecording && <Flex>{recordingDuration} seconds</Flex>}
            <Button
              color="red"
              onClick={() => {
                stopRecording();
                closeRecordingModal();
              }}
            >
              Stop Recording
            </Button>
          </Flex>
        </Modal>
        {/* DEBUG ELEMENTS */}
        {/* <div>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target?.files?.[0] || null;

              if (!file) {
                console.log("no file uploaded");
                return;
              }

              const context = new AudioContext({
                sampleRate: 16000,
                // channelCount: 1,
                // echoCancellation: false,
                // autoGainControl: true,
                // noiseSuppression: true,
              });

              console.log("context created, creating reader");

              const reader = new FileReader();
              reader.onload = function () {
                if (!reader.result) {
                  console.log("No reader.result");
                  return;
                }

                const buf = new Uint8Array(
                  reader.result as unknown as ArrayBuffer
                );

                context.decodeAudioData(buf.buffer, function (audioBuffer) {
                  console.log("decoding audio data");
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
                    .then(async function (renderedBuffer) {
                      const newAudio = renderedBuffer.getChannelData(0);
                      whisper?.processAudio(newAudio);
                    });
                });
              };

              reader.readAsArrayBuffer(file);
            }}
          />
        </div>
        {audioString && (
          <>
            <Flex direction="column" gap={20}>
              <Text>Processed Audio</Text>
              <audio ref={audioRef} controls></audio>
            </Flex>
            <textarea value={audioString} readOnly></textarea>
            <a href={audioString} download>
              Download audio
            </a>
          </>
        )} */}
      </Flex>
    </>
  );
}

// const kMaxRecording_s = 2 * 60;
const kSampleRate = 16000;

function getMicrophone({
  startedCallback,
  userMediaErrorCallback,
  finishedCallback,
}: {
  startedCallback: () => void;
  userMediaErrorCallback: () => void;
  finishedCallback: (audio: Float32Array, blob: Blob) => void;
}) {
  console.log("useMicrophone called");
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  function start() {
    stream = null;
    mediaRecorder = null;
    chunks = [];

    const context = new AudioContext({
      sampleRate: kSampleRate,
      // channelCount: 1,
      // echoCancellation: false,
      // autoGainControl: true,
      // noiseSuppression: true,
    });
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(function (s) {
        startedCallback();
        stream = s;
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) {
          chunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
          const blob = new Blob(chunks, {
            type: "audio/webm;codecs=opus",
          });
          chunks = [];

          const reader = new FileReader();
          reader.onload = function () {
            if (!reader.result) {
              // we need a result
              return;
            }
            console.log({ readerResult: reader.result });
            const buf = new Uint8Array(reader.result as unknown as ArrayBuffer);

            context.decodeAudioData(
              buf.buffer,
              function (audioBuffer) {
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
                  const audio = renderedBuffer.getChannelData(0);
                  console.log("js: audio recorded, size: " + audio.length);

                  finishedCallback(audio, blob);

                  // truncate to first 30 seconds
                  // if (audio.length > kMaxRecording_s * kSampleRate) {
                  //   audio = audio.slice(0, kMaxRecording_s * kSampleRate);
                  //   // console.log(
                  //   //   "js: truncated audio to first " +
                  //   //     kMaxRecording_s +
                  //   //     " seconds"
                  //   // );
                  // }
                });
              },
              function (e) {
                userMediaErrorCallback();
                console.log("js: error decoding audio: " + e);
                // audio = null;
              }
            );
          };

          reader.readAsArrayBuffer(blob);
        };
        mediaRecorder.start();
      })
      .catch(function (err) {
        console.log("js: error getting audio stream: " + err);
      });
  }

  return {
    start,
    stop: () => {
      if (mediaRecorder) {
        mediaRecorder?.stop();
      }
      if (stream) {
        stream?.getTracks().forEach(function (track) {
          track.stop();
        });
      }
    },
  };
}
