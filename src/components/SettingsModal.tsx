import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAtom } from "jotai";
import {
  Modal,
  Group,
  Button,
  NativeSelect,
  Box,
  Flex,
  Slider,
  InputLabel,
  Text,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  ModelOption,
  whisperModelSizes,
  whisperModelsBase,
  whisperModelsQuantized,
} from "../whisper-utils";
import { currentModel, currentSettings, fetchTimestamp } from "../state/main";
import { getDownloadedModels, loadOrGetModel } from "../utils/model-data";
import { WhisperModelName } from "../types";
import { IconQuestionMark } from "@tabler/icons-react";

interface SettingsModalProps {
  opened: boolean;
  closeable: boolean;
  onSubmit?: (() => void) | (() => Promise<void>);
  onClose?: (() => void) | (() => Promise<void>);
}

export function SettingsModal({
  opened,
  closeable = false,
  onSubmit = () => {},
  onClose = () => {},
}: SettingsModalProps) {
  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [settings, setSettings] = useAtom(currentSettings);
  const [selectedModel, setSelectedModel] = useState<WhisperModelName>();
  const [threads, setThreads] = useState(2);
  const [model, setCurrentModel] = useAtom(currentModel);
  const [newModel, setNewModel] = useState<Uint8Array>();
  const whisperModelUpdated = useCallback((_newModel: Uint8Array) => {
    setNewModel(_newModel);
  }, []);
  const [whisperModelsBaseState, setWhisperModelsBaseState] =
    useState(whisperModelsBase);
  const [whisperModelsQuantizedState, setWhisperModelsQuantizedState] =
    useState(whisperModelsQuantized);

  useEffect(() => {
    setNewModel(model);
  }, [model]);

  useEffect(() => {
    if (settings?.selectedModel) {
      setSelectedModel(settings.selectedModel as WhisperModelName);
    }

    if (settings?.threads) {
      setThreads(settings.threads);
    }
  }, [settings]);

  const {
    loaded: whisperModelLoaded,
    loading: whisperModelLoading,
    loadingProgress,
  } = useModelData(selectedModel, whisperModelUpdated);

  useEffect(() => {
    if (whisperModelLoaded) {
      const updateModels = async (
        models: ModelOption[],
        setStateCallback: Dispatch<SetStateAction<ModelOption[]>>
      ) => {
        const downloadedModels = await getDownloadedModels().catch(
          () => [] as string[]
        );
        const updatedModels = models.map((item) => {
          const isDownloaded = downloadedModels.includes(item.value);
          return {
            ...item,
            label: isDownloaded ? `${item.label} Downloaded` : item.label,
          };
        });
        setStateCallback(updatedModels);
      };

      (async () => {
        await Promise.all([
          updateModels(whisperModelsBase, setWhisperModelsBaseState),
          updateModels(whisperModelsQuantized, setWhisperModelsQuantizedState),
        ]);
      })();
    }
  }, [whisperModelLoaded]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={closeable ? "Settings" : "Welcome"}
      closeOnClickOutside={closeable}
      closeOnEscape={closeable}
      withCloseButton={closeable}
      centered
    >
      {!closeable && (
        <Box p={4}>
          To begin using Orderly, you will need to load a Whisper Model.
        </Box>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();

          if (!whisperModelLoaded) {
            console.log("Not loaded");
            return;
          }

          if (!settings) {
            return;
          }

          // TODO: pass values to be saved at App level

          // FOR NOW: save directly from here
          setSettings({
            threads,
            selectedModel,
          });

          setCurrentModel(newModel);

          setFetchTimestamp(Date.now());

          onSubmit();
        }}
      >
        <InputLabel mb={8}>
          <Flex align={"center"} gap={8}>
            <Text>Whisper Model</Text>
            <Tooltip
              multiline
              maw={300}
              label="Model size is a tradeoff. Larger models are more accurate but they take longer to run and occupy more RAM. We recommend using the smallest model that still gives you reliable results."
            >
              <ActionIcon radius="xl" variant="outline">
                <IconQuestionMark />
              </ActionIcon>
            </Tooltip>
          </Flex>
        </InputLabel>
        <NativeSelect
          value={selectedModel}
          data={[
            { label: "None", value: "" },
            {
              group: "Raw",
              items: whisperModelsBaseState,
            },
            {
              group: "Quantized",
              items: whisperModelsQuantizedState,
            },
          ]}
          onChange={(e) => {
            console.log("Loading Model: ", e.currentTarget.value);
            setSelectedModel(
              e.currentTarget.value as keyof typeof whisperModelSizes
            );
          }}
        />

        {whisperModelLoading && (
          <Box w="100%">
            <Flex w="100%" justify="center" p={4}>
              Loading... {`${loadingProgress}%`}
            </Flex>
            <Box h={4} w={`${loadingProgress}%`} bg="blue"></Box>
          </Box>
        )}

        {selectedModel && whisperModelLoaded && (
          <Flex justify="center" w="100%" p={4}>
            Model Loaded
          </Flex>
        )}

        {selectedModel && !whisperModelLoaded && !whisperModelLoading && (
          <div>
            Model must be loaded before saving settings. If you aborted a
            previous download, change the selection to restart the download.
          </div>
        )}

        <Group mt={8} justify="space-between" w="100%">
          <InputLabel>
            <Flex align={"center"} gap={8}>
              <Text>Number of Threads</Text>
              <Tooltip
                multiline
                maw={300}
                label="Number of threads to use for inference. More threads means faster inference but more RAM is required. Be careful with this setting. Creating more threads than truly available will degrade performance. Start small and work up until it feels slower."
              >
                <ActionIcon radius="xl" variant="outline">
                  <IconQuestionMark />
                </ActionIcon>
              </Tooltip>
            </Flex>
          </InputLabel>
          <Slider
            w={"100%"}
            value={threads}
            min={1}
            max={navigator.hardwareConcurrency}
            step={1}
            onChange={(value) => {
              setThreads(value);
            }}
            thumbChildren={<Text size="1rem">{threads}</Text>}
            thumbSize={32}
            label={null}
          />
        </Group>

        <Group justify="flex-end" mt={24}>
          {closeable && (
            <Button
              type="button"
              variant="subtle"
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!whisperModelLoaded}>
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

function useModelData(
  selectedModel: WhisperModelName,
  whisperModelLoaded: (newModel: Uint8Array) => void
) {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [, setCurrentModel] = useAtom(currentModel);

  useEffect(() => {
    async function loadModel() {
      if (!selectedModel) {
        return;
      }

      setLoading(true);
      setLoadingProgress(0);
      await loadOrGetModel(selectedModel, (progress) => {
        setLoadingProgress(Math.floor(progress * 100));
      })
        .then((result) => {
          if (result) {
            setLoadingProgress(100);
            whisperModelLoaded(result);
          }
        })
        .catch(() => {
          setLoadingProgress(0);
        });
      setLoading(false);
    }

    loadModel();
  }, [selectedModel, setCurrentModel, whisperModelLoaded]);

  return {
    loading,
    loadingProgress,
    loaded: !loading && loadingProgress === 100,
  };
}
