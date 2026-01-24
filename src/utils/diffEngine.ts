import { diff, Diff } from 'deep-diff';
import { DiffResult, FieldChange, ModifiedItem } from '../types/diff';

/**
 * Converts deep-diff path to a dot-notation string
 */
function pathToString(path: (string | number)[] | undefined): string {
  if (!path) return '';
  return path.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.');
}

/**
 * Deep sorts arrays within an object to ignore order differences
 * Arrays of primitives are sorted by value
 * Arrays of objects are sorted by JSON string representation
 */
function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    // Normalize each element first
    const normalized = value.map(normalizeValue);

    // Sort the array
    return normalized.sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });
  }

  if (typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).sort();
    for (const key of keys) {
      normalized[key] = normalizeValue((value as Record<string, unknown>)[key]);
    }
    return normalized;
  }

  return value;
}

/**
 * Normalizes an object by sorting all nested arrays
 */
function normalizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  return normalizeValue(obj) as Record<string, unknown>;
}

/**
 * Converts deep-diff result to our FieldChange format
 */
function convertDiffToFieldChanges(
  differences: Diff<Record<string, unknown>, Record<string, unknown>>[] | undefined
): FieldChange[] {
  if (!differences) return [];

  return differences.map((d) => {
    const path = pathToString(d.path);

    switch (d.kind) {
      case 'N': // New property
        return {
          path,
          oldValue: undefined,
          newValue: d.rhs,
          type: 'added' as const,
        };
      case 'D': // Deleted property
        return {
          path,
          oldValue: d.lhs,
          newValue: undefined,
          type: 'removed' as const,
        };
      case 'E': // Edited property
        return {
          path,
          oldValue: d.lhs,
          newValue: d.rhs,
          type: 'changed' as const,
        };
      case 'A': // Array change
        return {
          path: `${path}[${d.index}]`,
          oldValue: d.item.kind === 'D' ? d.item.lhs : undefined,
          newValue: d.item.kind === 'N' ? d.item.rhs : undefined,
          type: d.item.kind === 'N' ? 'added' as const :
                d.item.kind === 'D' ? 'removed' as const : 'changed' as const,
        };
      default:
        return {
          path,
          oldValue: undefined,
          newValue: undefined,
          type: 'changed' as const,
        };
    }
  });
}

/**
 * Compares two objects and returns field-level changes
 * Normalizes arrays to ignore order differences
 */
function compareObjects(
  keyValue: string | number,
  sourceObj: Record<string, unknown>,
  targetObj: Record<string, unknown>
): ModifiedItem {
  // Normalize both objects to ignore array order
  const normalizedSource = normalizeObject(sourceObj);
  const normalizedTarget = normalizeObject(targetObj);

  const differences = diff(normalizedSource, normalizedTarget);
  const changes = convertDiffToFieldChanges(differences);

  return {
    keyValue,
    sourceObject: sourceObj,
    targetObject: targetObj,
    changes,
  };
}

/**
 * Main function to compare two JSON lists by a match key
 */
export function compareJsonLists(
  source: Record<string, unknown>[],
  target: Record<string, unknown>[],
  matchKey: string
): DiffResult {
  // Create indexes for both lists
  const sourceIndex = new Map<string | number, Record<string, unknown>>();
  const targetIndex = new Map<string | number, Record<string, unknown>>();

  source.forEach((obj) => {
    const key = obj[matchKey] as string | number;
    if (key !== undefined && key !== null) {
      sourceIndex.set(key, obj);
    }
  });

  target.forEach((obj) => {
    const key = obj[matchKey] as string | number;
    if (key !== undefined && key !== null) {
      targetIndex.set(key, obj);
    }
  });

  const sourceKeys = new Set(sourceIndex.keys());
  const targetKeys = new Set(targetIndex.keys());

  // Find added (in target but not in source)
  const addedKeys = [...targetKeys].filter((k) => !sourceKeys.has(k));
  const added = addedKeys.map((k) => targetIndex.get(k)!);

  // Find removed (in source but not in target)
  const removedKeys = [...sourceKeys].filter((k) => !targetKeys.has(k));
  const removed = removedKeys.map((k) => sourceIndex.get(k)!);

  // Find matched keys
  const matchedKeys = [...sourceKeys].filter((k) => targetKeys.has(k));

  // Compare matched objects
  const modified: ModifiedItem[] = [];
  const unchanged: Record<string, unknown>[] = [];

  matchedKeys.forEach((key) => {
    const sourceObj = sourceIndex.get(key)!;
    const targetObj = targetIndex.get(key)!;
    const comparison = compareObjects(key, sourceObj, targetObj);

    if (comparison.changes.length > 0) {
      modified.push(comparison);
    } else {
      unchanged.push(sourceObj);
    }
  });

  return {
    summary: {
      totalSource: source.length,
      totalTarget: target.length,
      matched: matchedKeys.length,
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      unchanged: unchanged.length,
    },
    matchKey,
    added,
    removed,
    modified,
    unchanged,
  };
}
