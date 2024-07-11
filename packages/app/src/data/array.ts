export const unique = <T>(arr: T[]) => [...new Set(arr)];

export const indexBy = <Item, Key extends PropertyKey>(
  items: Item[],
  keyFn: (item: Item) => Key
) =>
  items.reduce<Partial<Record<Key, Item>>>((indexed, item) => {
    const key = keyFn(item);
    if (indexed[key] !== undefined)
      throw new Error(`Duplicated key ${String(key)}`);
    return {
      ...indexed,
      [key]: item,
    };
  }, {});
