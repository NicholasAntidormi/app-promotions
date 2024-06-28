export const mapValues = <Value, NewVal>(
  obj: Record<PropertyKey, Value>,
  fn: (value: Value) => NewVal
) =>
  Object.fromEntries(Object.entries(obj).map(([key, val]) => [key, fn(val)]));

export const pick = <T, K extends keyof T>(obj: T, keys: K[] | readonly K[]) =>
  (keys as K[]).reduce<Pick<T, K>>(
    (picked, key) => ({
      ...picked,
      [key]: obj[key],
    }),
    // @ts-expect-error too flexible for js
    {}
  );
