// Common Javascript functions used by the examples

export const dbVersion = 1;
export const dbName = "whisper.ggerganov.com";

export async function clearCache() {
  if (
    confirm(
      "Are you sure you want to clear the cache?\nAll the models will be downloaded again."
    )
  ) {
    indexedDB.deleteDatabase(dbName);
    location.reload();
  }
}

// fetch a remote file from remote URL using the Fetch API
async function fetchRemote(
  url: string,
  cbProgress: (p: number) => void,
  cbPrint: (message: string) => void
) {
  cbPrint("fetchRemote: downloading with fetch()...");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  if (!response.ok) {
    cbPrint("fetchRemote: failed to fetch " + url);
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
        cbPrint("fetchRemote: fetching " + 10 * progressCur + "% ...");
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

// load remote data
// - check if the data is already in the IndexedDB
// - if not, fetch it from the remote URL and store it in the IndexedDB
export function loadRemote(
  url: string,
  dst: string,
  size_mb: number,
  cbProgress: (p: number) => void,
  // eslint-disable-next-line @typescript-eslint/ban-types
  cbReady: Function,
  // eslint-disable-next-line @typescript-eslint/ban-types
  cbCancel: Function,
  cbPrint: (message: string) => void
) {
  if (!navigator.storage || !navigator.storage.estimate) {
    cbPrint("loadRemote: navigator.storage.estimate() is not supported");
  } else {
    // query the storage quota and print it
    navigator.storage.estimate().then(function (estimate) {
      cbPrint("loadRemote: storage quota: " + estimate.quota + " bytes");
      cbPrint("loadRemote: storage usage: " + estimate.usage + " bytes");
    });
  }

  // check if the data is already in the IndexedDB
  const rq = indexedDB.open(dbName, dbVersion);

  rq.onupgradeneeded = function (event: IDBVersionChangeEvent) {
    // @ts-expect-error not sure whats wrong
    const db = event.target!.result;
    if (db.version == 1) {
      db.createObjectStore("models", { autoIncrement: false });
      cbPrint(
        "loadRemote: created IndexedDB " + db.name + " version " + db.version
      );
    } else {
      // clear the database
      // @ts-expect-error this event type seems wrong
      const os = event.currentTarget!.transaction.objectStore("models");
      os.clear();
      cbPrint(
        "loadRemote: cleared IndexedDB " + db.name + " version " + db.version
      );
    }
  };

  rq.onsuccess = function (event: Event) {
    // @ts-expect-error not sure
    const db = event.target?.result;
    const tx = db.transaction(["models"], "readonly");
    const os = tx.objectStore("models");
    const rq = os.get(url);

    rq.onsuccess = function () {
      if (rq.result) {
        cbPrint('loadRemote: "' + url + '" is already in the IndexedDB');
        cbReady(dst, rq.result);
      } else {
        // data is not in the IndexedDB
        cbPrint('loadRemote: "' + url + '" is not in the IndexedDB');

        // alert and ask the user to confirm
        if (
          !confirm(
            "You are about to download " +
              size_mb +
              " MB of data.\n" +
              "The model data will be cached in the browser for future use.\n\n" +
              "Press OK to continue."
          )
        ) {
          cbCancel();
          return;
        }

        fetchRemote(url, cbProgress, cbPrint).then(function (data) {
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
                rq = os.put(data, url);
              } catch (e) {
                cbPrint(
                  'loadRemote: failed to store "' +
                    url +
                    '" in the IndexedDB: \n' +
                    e
                );
                cbCancel();
                return;
              }

              rq.onsuccess = function () {
                cbPrint('loadRemote: "' + url + '" stored in the IndexedDB');
                cbReady(dst, data);
              };

              rq.onerror = function () {
                cbPrint(
                  'loadRemote: failed to store "' + url + '" in the IndexedDB'
                );
                cbCancel();
              };
            };
          }
        });
      }
    };

    rq.onerror = function () {
      cbPrint("loadRemote: failed to get data from the IndexedDB");
      cbCancel();
    };
  };

  rq.onerror = function () {
    cbPrint("loadRemote: failed to open IndexedDB");
    cbCancel();
  };

  rq.onblocked = function () {
    cbPrint("loadRemote: failed to open IndexedDB: blocked");
    cbCancel();
  };

  // @ts-expect-error not sure
  rq.onabort = function () {
    cbPrint("loadRemote: failed to open IndexedDB: abort");
    cbCancel();
  };
}
