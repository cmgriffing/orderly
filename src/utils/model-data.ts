import { whisperModelSizes } from "../whisper-utils";

const dbVersion = 1;
const dbName = "whisperModels";

// local
// const modelBaseUrl = "/models";
// remote
// const modelBaseUrl = "https://f002.backblazeb2.com/file/orderly-models"; // NO CORS
const modelBaseUrl =
  "https://link.storjshare.io/s/jueavj4qtolpgszkbp5awref22da/models";

// TODO: this method seems to leak memory when changing models
export function loadOrGetModel(
  selectedModel: keyof typeof whisperModelSizes | "" | undefined,
  progressCallback: (progress: number) => void
): Promise<Uint8Array | undefined> {
  return new Promise((resolve, reject) => {
    if (!selectedModel) {
      resolve(undefined);
      return;
    }
    if (!navigator.storage || !navigator.storage.estimate) {
      console.log("loadRemote: navigator.storage.estimate() is not supported");
    } else {
      // query the storage quota and print it
      navigator.storage.estimate().then(function (estimate) {
        console.log("loadRemote: storage quota: " + estimate.quota + " bytes");
        console.log("loadRemote: storage usage: " + estimate.usage + " bytes");
      });
    }

    const openRequest = indexedDB.open(dbName, dbVersion);

    openRequest.onupgradeneeded = function () {
      const db = openRequest.result;
      if (db.version == 1) {
        db.createObjectStore("models", { autoIncrement: false });
        console.log(
          "loadRemote: created IndexedDB " + db.name + " version " + db.version
        );
      } else {
        // clear the database
        // @ts-expect-error this event type seems wrong
        const os = openRequest.transaction.objectStore("models");
        os.clear();
        console.log(
          "loadRemote: cleared IndexedDB " + db.name + " version " + db.version
        );
      }
    };

    openRequest.onsuccess = function () {
      const db = openRequest.result;
      const tx = db.transaction(["models"], "readonly");
      const objectStore = tx.objectStore("models");
      const localFileRequest = objectStore.get(selectedModel);

      localFileRequest.onsuccess = async function () {
        if (localFileRequest.result) {
          console.log(
            'loadRemote: "' + selectedModel + '" is already in the IndexedDB'
          );
          resolve(localFileRequest.result);
          console.log({ localFileRequest });
          return;
        } else {
          console.log(
            'loadRemote: "' + selectedModel + '" is not in the IndexedDB'
          );
          // fetch the model

          if (
            !confirm(
              "You are about to download " +
                whisperModelSizes[selectedModel] +
                " MB of data.\n" +
                "The model data will be cached in the browser for future use.\n\n" +
                "Press OK to continue."
            )
          ) {
            resolve(undefined);
            return;
          }

          const url = `${modelBaseUrl}/${selectedModel}.bin?download=1`;

          fetchRemote(url, (progress) => {
            progressCallback(progress);
          }).then((data) => {
            console.log("fetchedModel", data);

            if (data) {
              // store the data in the IndexedDB
              const rq = indexedDB.open(dbName, dbVersion);
              rq.onsuccess = function (event: Event) {
                // @ts-expect-error not sure
                const db = event.target.result;
                const tx = db.transaction(["models"], "readwrite");
                const os = tx.objectStore("models");

                let rq = null;
                try {
                  rq = os.put(data, selectedModel);
                } catch (e) {
                  console.log(
                    'loadRemote: failed to store "' +
                      url +
                      '" in the IndexedDB: \n' +
                      e
                  );
                  reject();
                  // cbCancel();
                  return;
                }

                rq.onsuccess = function () {
                  console.log(
                    'loadRemote: "' + url + '" stored in the IndexedDB'
                  );
                  resolve(data);
                  // cbReady(dst, data);
                };

                rq.onerror = function () {
                  console.log(
                    'loadRemote: failed to store "' + url + '" in the IndexedDB'
                  );
                  reject();
                  // cbCancel();
                };
              };
            }
          });
        }
      };
    };
  });
}

export async function fetchRemote(
  url: string,
  cbProgress: (p: number) => void
) {
  console.log("fetchRemote: downloading with fetch()...");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  if (!response.ok) {
    console.log("fetchRemote: failed to fetch " + url);
    return;
  }

  const contentLength = response.headers.get("content-length");

  if (!contentLength) {
    return;
  }

  const total = parseInt(contentLength, 10);
  const reader = response.body?.getReader();

  if (!reader) {
    return;
  }

  const chunks = [];
  let receivedLength = 0;
  let progressLast = -1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (contentLength) {
      cbProgress(receivedLength / total);

      const progressCur = Math.round((receivedLength / total) * 10);
      if (progressCur != progressLast) {
        console.log("fetchRemote: fetching " + 10 * progressCur + "% ...");
        progressLast = progressCur;
      }
    }
  }

  let position = 0;
  const chunksAll = new Uint8Array(receivedLength);

  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return chunksAll;
}
