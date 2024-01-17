import { whisperModelSizes } from "./whisper-utils";

export type WhisperModelName = keyof typeof whisperModelSizes | "" | undefined;
