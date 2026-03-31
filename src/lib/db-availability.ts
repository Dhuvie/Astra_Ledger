import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";

/** True when the DB is unreachable (nothing listening, Docker down, wrong host, etc.). */
export function isUnreachableDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1017";
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /Can't reach database server|ECONNREFUSED|P1001|P1017/i.test(msg);
}

let resolved: boolean | null = null;
let inflight: Promise<boolean> | null = null;

/**
 * `DATABASE_URL` is set **and** MongoDB answers. If the server is down, returns `false` and the app
 * should use the file workspace (same as having no URL). Result is cached for the process lifetime.
 */
export async function isLiveDatabase(): Promise<boolean> {
  if (!isDatabaseConfigured) {
    return false;
  }
  if (resolved !== null) {
    return resolved;
  }

  inflight ??= probe();
  return inflight;
}

async function probe(): Promise<boolean> {
  try {
    await prisma.$connect();
    resolved = true;
    return true;
  } catch (error) {
    if (isUnreachableDbError(error)) {
      resolved = false;
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Astra] DATABASE_URL is set but MongoDB is unreachable. Using file-based data (data/workspace-state.json). Start MongoDB or remove DATABASE_URL to silence this.",
        );
      }
      return false;
    }
    throw error;
  } finally {
    inflight = null;
  }
}
