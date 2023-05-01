import tmp from "tmp";

export type TmpFile = {
  path: string;
  cleanup: () => void;
};

export const createTmpDbFile = () => {
  return new Promise<TmpFile>((resolve, reject) => {
    tmp.file(
      { prefix: "test", postfix: ".db" },
      (error, path, _fd, cleanup) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({ path, cleanup });
      }
    );
  });
};
