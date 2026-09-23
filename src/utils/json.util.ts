export function serialize<T>(obj: T): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}

export function deserialize<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function deserializeByClass<T>(json: string, _cls: new () => T): T | null {
  return deserialize<T>(json);
}

export function serializeNonNull<T extends object>(obj: T): string {
  try {
    return JSON.stringify(obj, (_key, value) =>
      value === null || value === undefined ? undefined : value,
    );
  } catch {
    return '';
  }
}

export function deepClone<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as Record<string, unknown>;
    for (const key of Object.keys(obj as object)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
    return cloned as T;
  }
  return obj;
}
