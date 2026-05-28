export function stripPasswordHash<T extends { passwordHash?: string }>(value: T) {
  const { passwordHash, ...safe } = value;
  return safe;
}
