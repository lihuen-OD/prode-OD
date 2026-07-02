export function stripPasswordHash<T>(value: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...safe } = value as T & { passwordHash?: string };
  return safe;
}
