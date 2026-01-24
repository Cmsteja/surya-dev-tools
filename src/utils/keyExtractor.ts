/**
 * Extracts potential match keys from a JSON array
 * Returns keys that have primitive values (string/number) suitable for matching
 */
export function extractKeys(jsonList: Record<string, unknown>[]): string[] {
  if (!jsonList || jsonList.length === 0) return [];

  const firstObj = jsonList[0];
  if (!firstObj || typeof firstObj !== 'object') return [];

  return Object.keys(firstObj).filter((key) => {
    const value = firstObj[key];
    return typeof value === 'string' || typeof value === 'number';
  });
}

/**
 * Finds common keys between two JSON arrays
 */
export function findCommonKeys(
  source: Record<string, unknown>[],
  target: Record<string, unknown>[]
): string[] {
  const sourceKeys = new Set(extractKeys(source));
  const targetKeys = extractKeys(target);

  return targetKeys.filter((key) => sourceKeys.has(key));
}

/**
 * Validates if a key exists and has unique values in the array
 */
export function validateMatchKey(
  jsonList: Record<string, unknown>[],
  key: string
): { valid: boolean; message?: string } {
  if (!jsonList || jsonList.length === 0) {
    return { valid: false, message: 'Empty array' };
  }

  const values = jsonList.map((obj) => obj[key]);
  const uniqueValues = new Set(values);

  if (uniqueValues.size !== values.length) {
    return {
      valid: false,
      message: `Key "${key}" has duplicate values (${values.length - uniqueValues.size} duplicates)`,
    };
  }

  if (values.some((v) => v === undefined || v === null)) {
    return {
      valid: false,
      message: `Key "${key}" has missing values in some objects`,
    };
  }

  return { valid: true };
}
