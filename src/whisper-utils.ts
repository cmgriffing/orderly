export const whisperModelUrls = {
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

export const whisperModelSizes = {
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

export interface ModelOption {
  label: string;
  value: keyof typeof whisperModelUrls;
}

export const whisperModelsBase: ModelOption[] = [
  {
    label: "tiny.en (75 MB)",
    value: "tiny.en",
  },
  {
    label: "tiny (75 MB)",
    value: "tiny",
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

export const whisperModelsQuantized: ModelOption[] = [
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
    label: "small (Q5_1, 182 MB)",
    value: "small-q5_1",
  },

  {
    label: "medium.en (Q5_0, 515 MB)",
    value: "medium-en-q5_0",
  },
  {
    label: "medium (Q5_0, 515 MB)",
    value: "medium-q5_0",
  },

  {
    label: "large (Q5_0, 1030 MB)",
    value: "large-q5_0",
  },
];

export const whisperModels = [...whisperModelsBase, ...whisperModelsQuantized];
