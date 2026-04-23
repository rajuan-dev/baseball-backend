export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<T> => {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) {
      acc[key] = obj[key];
    }

    return acc;
  }, {} as Partial<T>);
};
