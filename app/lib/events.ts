import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const entitiesRoot = path.join(process.cwd(), "entities");

// Simple in-memory lock to prevent concurrent writes to the same entity
const writeLocks = new Map<string, Promise<void>>();

async function withLock<T>(entityId: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any existing write to complete
  const existingLock = writeLocks.get(entityId);
  if (existingLock) {
    await existingLock;
  }
  
  // Create a new lock promise
  let resolve: () => void;
  const lockPromise = new Promise<void>((r) => { resolve = r; });
  writeLocks.set(entityId, lockPromise);
  
  try {
    return await fn();
  } finally {
    resolve!();
    writeLocks.delete(entityId);
  }
}

// Encrypted payload structure (server only sees this)
// nonce is optional because asymmetric encryption (crypto_box_seal) doesn't use an external nonce
export type EncryptedPayload = {
  version: number;
  alg: string;
  nonce?: string;
  ciphertext: string;
};

// Encrypted event stored on server (server cannot read content)
export type EncryptedEvent = {
  id: string;
  timestamp: string;
  payload: EncryptedPayload;
};

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function getEventLogPath(entityId: string): string {
  return path.join(entitiesRoot, entityId, "events.json");
}

export async function getEventStream(entityId: string): Promise<EncryptedEvent[]> {
  const filePath = getEventLogPath(entityId);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    try {
      return JSON.parse(raw) as EncryptedEvent[];
    } catch (parseError) {
      // Try to recover from corrupted JSON by finding valid array
      console.error(`[Events] JSON parse error for ${entityId}, attempting recovery...`);
      const bracketMatch = findValidJsonArray(raw);
      if (bracketMatch) {
        const recovered = JSON.parse(bracketMatch) as EncryptedEvent[];
        // Write back the recovered data
        await fs.writeFile(filePath, bracketMatch, "utf8");
        console.log(`[Events] Recovered ${recovered.length} events for ${entityId}`);
        return recovered;
      }
      console.error(`[Events] Could not recover events for ${entityId}, starting fresh`);
      return [];
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function findValidJsonArray(content: string): string | null {
  let bracketCount = 0;
  let endPos = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "[") bracketCount++;
    else if (content[i] === "]") {
      bracketCount--;
      if (bracketCount === 0) {
        endPos = i + 1;
        break;
      }
    }
  }
  if (endPos > 0) {
    const candidate = content.slice(0, endPos);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      return null;
    }
  }
  return null;
}

export async function appendEvent(
  entityId: string,
  payload: EncryptedPayload
): Promise<EncryptedEvent> {
  return withLock(entityId, async () => {
    const entityDir = path.join(entitiesRoot, entityId);
    await ensureDir(entityDir);

    const filePath = getEventLogPath(entityId);
    const events = await getEventStream(entityId);

    const newEvent: EncryptedEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload,
    };

    events.push(newEvent);
    await fs.writeFile(filePath, JSON.stringify(events, null, 2), "utf8");

    return newEvent;
  });
}
