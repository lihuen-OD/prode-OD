import { prisma } from '../config/prisma.js';
import type { Tournament } from '@prisma/client';

let cached: { value: Tournament | null; expiresAt: number } | null = null;
const TOURNAMENT_CACHE_TTL_MS = 30_000;

export async function getCachedCurrentTournament(): Promise<Tournament | null> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const tournament = await prisma.tournament.findFirst({ orderBy: { createdAt: 'desc' } });
  cached = { value: tournament, expiresAt: now + TOURNAMENT_CACHE_TTL_MS };
  return tournament;
}

export function invalidateTournamentCache() {
  cached = null;
}
