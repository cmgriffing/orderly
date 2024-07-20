import { useEffect, useRef, useState, startTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Flex, Button, Modal, Text, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import {
  currentSnippet,
  currentSnippets,
  currentSnippetId,
  fetchTimestamp,
  whisperInstance,
  currentSettings,
  currentChapterId,
} from "../state/main";
import { IconCirclePlus } from "@tabler/icons-react";
import { SnippetModel, SnippetsCRUD } from "../data/repositories/snippets";
import { SnippetForm } from "../components/SnippetForm";
import { CountingLoader } from "../components/CountingLoader";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { NotFoundPageWrapper } from "../components/NotFoundPageWrapper";
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
  const navigate = useNavigate();
  const { snippetId: rawSnippetId, bookId } = useParams();
  const snippetId = parseInt(rawSnippetId || "-1");
  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [, setCurrentSnippetId] = useAtom(currentSnippetId);
  const [chapterId] = useAtom(currentChapterId);
  const [snippet] = useAtom(currentSnippet);
  const [snippets] = useAtom(currentSnippets);
  const [settings] = useAtom(currentSettings);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingDuration, setProcessingDuration] = useState(0);
  const [whisper] = useAtom(whisperInstance);
  const [audio, setAudio] = useState<Float32Array>(new Float32Array());
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [, setAudioString] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [previousSnippet, setPreviousSnippet] = useState<SnippetModel>();
  const [nextSnippet, setNextSnippet] = useState<SnippetModel>();
  const [whisperResult, setWhisperResult] = useState("");

  const [
    recordingModalOpened,
    { open: openRecordingModal, close: closeRecordingModal },
  ] = useDisclosure(false);
  const [
    processingModalOpened,
    { open: openProcessingModal, close: closeProcessingModal },
  ] = useDisclosure(false);

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
          setAudio(newAudio);
          setAudioBlob(newAudioBlob);
          const result = await whisper?.processAudio(newAudio);

          if (result !== 0) {
            // non-zero exit code found. report problem to user
            // TODO: Make this something nicer than an alert
            alert("Error processing audio");
          } else {
            setIsProcessing(true);
            openProcessingModal();
            // recommend refresh if taking too long and advise fine tuning threads
          }
        },
      })
    );
  }, [whisper, settings, openProcessingModal]);

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
    async function listener(e: Event) {
      const event = e as CustomEvent;
      console.log("resultEvent", event, event.detail);
      setWhisperResult(event.detail || "");

      await SnippetsCRUD.update(snippetId, {
        content: event.detail,
        processedAt: Date.now(),
      });

      setIsProcessing(false);
      closeProcessingModal();

      startTransition(() => {
        setFetchTimestamp(Date.now());
      });
    }

    window.addEventListener("whisperResult", listener);

    return () => {
      window.removeEventListener("whisperResult", listener);
    };
  }, [snippetId, setFetchTimestamp, closeProcessingModal]);

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

  useEffect(() => {
    if (isProcessing) {
      const processingStartedAt = Date.now();
      setProcessingDuration(0);

      const processingInterval = setInterval(() => {
        setProcessingDuration(
          Math.floor((Date.now() - processingStartedAt) / 1000)
        );
      }, 1000);

      return () => {
        clearInterval(processingInterval);
      };
    }
  }, [isProcessing]);

  useEffect(() => {
    setCurrentSnippetId(snippetId);
  }, [snippetId, setCurrentSnippetId]);

  useEffect(() => {
    if (snippets) {
      let previous: SnippetModel | undefined = undefined;
      let next: SnippetModel | undefined = undefined;

      for (let i = 0; i < snippets.length; i++) {
        if (snippets[i].id === snippetId) {
          previous = snippets[i - 1];
          next = snippets[i + 1];
        }
      }

      setPreviousSnippet(previous);
      setNextSnippet(next);
    }
  }, [snippetId, snippets]);

  return (
    <NotFoundPageWrapper
      hasEntity={!!snippet}
      entityName="Snippet"
      notFoundContent={
        <>
          <Text w="300px">
            The snippet could not be found. You can create a new one using the
            chapters's menu in the secondary sidebar.
          </Text>
        </>
      }
    >
      <Flex
        direction={"column"}
        w="100%"
        maw={"600px"}
        mih={"90vh"}
        mah="90vh"
        h="90vh"
        mx={"auto"}
        px={24}
        justify={"space-between"}
        align="space-between"
      >
        {!!previousSnippet && (
          <SnippetForm
            snippet={previousSnippet}
            bookId={bookId || ""}
            disabled={true}
          />
        )}

        {!previousSnippet && <Box h="0px" />}

        <Flex direction={"column"} align="center" justify="center" my={20}>
          <Button
            variant="light"
            rightSection={<IconCirclePlus />}
            onClick={async () => {
              if (snippet) {
                const currentSnippetSortOrder = snippet.sortOrder;
                const previousSnippetSortOrder =
                  previousSnippet?.sortOrder || currentSnippetSortOrder - 1;
                const sortOrder =
                  (currentSnippetSortOrder + previousSnippetSortOrder) / 2;

                const newSnippet = await SnippetsCRUD.create({
                  sortOrder,
                  chapterId: snippet.chapterId,
                  label: "New Snippet",
                });

                navigate(
                  `/books/${bookId}/chapters/${snippet.chapterId}/snippets/${newSnippet?.id}`
                );

                startTransition(() => {
                  setFetchTimestamp(Date.now());
                });
              }
            }}
          >
            Insert Before
          </Button>
        </Flex>

        <SnippetForm
          snippet={snippet}
          bookId={bookId || ""}
          whisperResult={whisperResult}
          onEditLabel={async (label) => {
            await SnippetsCRUD.update(snippetId, {
              label,
            });
            startTransition(() => {
              setFetchTimestamp(Date.now());
            });
          }}
          onEditContent={async (content) => {
            await SnippetsCRUD.update(snippetId, {
              content,
            });
            startTransition(() => {
              setFetchTimestamp(Date.now());
            });
          }}
          onRecord={() => {
            openRecordingModal();
            startRecording();
          }}
          onDelete={async () => {
            await SnippetsCRUD.delete(snippetId);
            startTransition(() => {
              setFetchTimestamp(Date.now());
            });
            if (nextSnippet) {
              navigate(
                `/books/${bookId}/chapters/${chapterId}/snippets/${nextSnippet.id}`
              );
            } else if (previousSnippet) {
              navigate(
                `/books/${bookId}/chapters/${chapterId}/snippets/${previousSnippet.id}`
              );
            } else {
              navigate(`/books/${bookId}/chapters/${chapterId}`);
            }
          }}
        />

        <Flex direction={"column"} align="center" justify="center" my={20}>
          <Button
            variant="light"
            rightSection={<IconCirclePlus />}
            onClick={async () => {
              if (snippet) {
                const currentSnippetSortOrder = snippet.sortOrder;
                const nextSnippetSortOrder =
                  nextSnippet?.sortOrder || currentSnippetSortOrder + 1;
                const newSnippet = await SnippetsCRUD.create({
                  sortOrder:
                    (currentSnippetSortOrder + nextSnippetSortOrder) / 2,
                  chapterId: snippet.chapterId,
                  label: "New Snippet",
                });

                navigate(
                  `/books/${bookId}/chapters/${snippet.chapterId}/snippets/${newSnippet?.id}`
                );

                startTransition(() => {
                  setFetchTimestamp(Date.now());
                });
              }
            }}
          >
            Insert After
          </Button>
        </Flex>

        {!!nextSnippet && (
          <SnippetForm
            snippet={nextSnippet}
            bookId={bookId || ""}
            disabled={true}
            below={true}
          />
        )}

        {!nextSnippet && <Box h="0px" />}

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
            </Flex>
            <CountingLoader count={recordingDuration} color="red" />
            <Button
              color="red"
              onClick={() => {
                stopRecording();
                closeRecordingModal();
                SnippetsCRUD.update(snippetId, {
                  recordedAt: Date.now(),
                });
              }}
            >
              Stop Recording
            </Button>
          </Flex>
        </Modal>

        <Modal
          opened={processingModalOpened}
          closeOnClickOutside={false}
          closeOnEscape={false}
          withCloseButton={false}
          onClose={() => {
            // we shouldn't actually be able to get to here
            closeProcessingModal();
          }}
          centered
          size="auto"
          padding={24}
        >
          <Flex direction="column" align="center" justify="center" gap={20}>
            <Flex align="center" justify="center" gap={12}>
              <Text size="xl" fw="bold">
                Processing Audio
              </Text>
            </Flex>
            <CountingLoader color="blue" count={processingDuration} />

            {recordingDuration + 20 < processingDuration && (
              <Flex maw={"300px"}>
                <Text c="red">
                  This is taking longer than expected. You may want to fine tune
                  the amount of threads used by Whisper. It will often be
                  fastest with a couple less than the totally available cores.
                </Text>
              </Flex>
            )}
            <Flex maw={"300px"}>
              If you would like to cancel the process, please refresh the page.
            </Flex>
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
    </NotFoundPageWrapper>
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
