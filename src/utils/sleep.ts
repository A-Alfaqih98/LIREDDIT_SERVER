export const sleep = (ms: number) =>
  new Promise((resolve, _reject) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
