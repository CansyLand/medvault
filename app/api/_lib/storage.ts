import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const entitiesRoot = path.join(process.cwd(), "entities");
const passkeyMapFile = path.join(entitiesRoot, "_passkeys.json");
const inviteMapFile = path.join(entitiesRoot, "_invites.json");
const shareMapFile = path.join(entitiesRoot, "_shares.json");
const transfersFile = path.join(entitiesRoot, "_transfers.json");

type PasskeyMap = Record<string, string>;
type InviteRecord = {
  entityId: string;
  sealed: unknown;
  expiresAt: number;
};
type InviteMap = Record<string, InviteRecord>;

// Entity roles for access control
export type EntityRole = "doctor" | "patient";

// Transfer records for audit trail
export type TransferRecord = {
  id: string;
  recordKey: string;
  fromEntityId: string;
  toEntityId: string;
  transferredAt: string;
  autoShareGranted: boolean;
};
type TransferMap = TransferRecord[];

export type ShareRecord = {
  sourceEntityId: string;
  propertyName: string;
  sealedKey: unknown;
  expiresAt: number;
};
type ShareMap = Record<string, ShareRecord>;

export type OutgoingShare = {
  targetEntityId: string;
  propertyName: string;
};

export type IncomingShare = {
  sourceEntityId: string;
  propertyName: string;
  keyWrapped: unknown;
};

export type EntityShares = {
  outgoing: OutgoingShare[];
  incoming: IncomingShare[];
};

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }
    throw err;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function sanitizeFilename(filename: string): string {
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    throw new Error("Invalid filename.");
  }
  return filename;
}

export async function ensureEntitiesRoot(): Promise<void> {
  await ensureDir(entitiesRoot);
}

export async function resetAllEntities(): Promise<void> {
  await fs.rm(entitiesRoot, { recursive: true, force: true });
}

export async function getEntityIdForPasskey(passkeyId: string): Promise<string | null> {
  const map = await readJsonFile<PasskeyMap>(passkeyMapFile, {});
  return map[passkeyId] ?? null;
}

export async function linkPasskeyToEntity(passkeyId: string, entityId: string): Promise<void> {
  const map = await readJsonFile<PasskeyMap>(passkeyMapFile, {});
  map[passkeyId] = entityId;
  await writeJsonFile(passkeyMapFile, map);
}

async function removeEntity(entityId: string): Promise<void> {
  const entityDir = path.join(entitiesRoot, entityId);
  await fs.rm(entityDir, { recursive: true, force: true });
}

function hasOtherPasskeys(map: PasskeyMap, entityId: string, passkeyId: string): boolean {
  return Object.entries(map).some(
    ([key, value]) => value === entityId && key !== passkeyId
  );
}

export async function relinkPasskeyToEntity(
  passkeyId: string,
  nextEntityId: string
): Promise<void> {
  const map = await readJsonFile<PasskeyMap>(passkeyMapFile, {});
  const previousEntityId = map[passkeyId];
  map[passkeyId] = nextEntityId;
  await writeJsonFile(passkeyMapFile, map);

  if (previousEntityId && previousEntityId !== nextEntityId) {
    const hasOthers = hasOtherPasskeys(map, previousEntityId, passkeyId);
    if (!hasOthers) {
      await removeEntity(previousEntityId);
    }
  }
}

export async function createEntity(): Promise<string> {
  await ensureEntitiesRoot();
  const entityId = randomUUID();
  await ensureDir(path.join(entitiesRoot, entityId));
  return entityId;
}

export async function ensureEntityDir(entityId: string): Promise<void> {
  await ensureDir(path.join(entitiesRoot, entityId));
}

export async function writeEntityFile(
  entityId: string,
  filename: string,
  payload: unknown
): Promise<void> {
  const safeName = sanitizeFilename(filename);
  const filePath = path.join(entitiesRoot, entityId, safeName);
  await ensureEntityDir(entityId);
  await writeJsonFile(filePath, payload);
}

export async function readEntityFile(
  entityId: string,
  filename: string
): Promise<unknown | null> {
  const safeName = sanitizeFilename(filename);
  const filePath = path.join(entitiesRoot, entityId, safeName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function createInvite(
  code: string,
  record: InviteRecord
): Promise<void> {
  const map = await readJsonFile<InviteMap>(inviteMapFile, {});
  map[code] = record;
  await writeJsonFile(inviteMapFile, map);
}

export async function consumeInvite(
  code: string
): Promise<InviteRecord | null> {
  const map = await readJsonFile<InviteMap>(inviteMapFile, {});
  const record = map[code];
  if (!record) return null;
  delete map[code];
  await writeJsonFile(inviteMapFile, map);
  return record;
}

export async function getInvite(code: string): Promise<InviteRecord | null> {
  const map = await readJsonFile<InviteMap>(inviteMapFile, {});
  return map[code] ?? null;
}

// =====================
// Share Storage
// =====================

function getEntitySharesPath(entityId: string): string {
  return path.join(entitiesRoot, entityId, "shares.json");
}

export async function createShare(
  code: string,
  record: ShareRecord
): Promise<void> {
  const map = await readJsonFile<ShareMap>(shareMapFile, {});
  map[code] = record;
  await writeJsonFile(shareMapFile, map);
}

export async function consumeShare(
  code: string
): Promise<ShareRecord | null> {
  const map = await readJsonFile<ShareMap>(shareMapFile, {});
  const record = map[code];
  if (!record) return null;
  delete map[code];
  await writeJsonFile(shareMapFile, map);
  return record;
}

export async function getShare(code: string): Promise<ShareRecord | null> {
  const map = await readJsonFile<ShareMap>(shareMapFile, {});
  return map[code] ?? null;
}

export async function getShares(entityId: string): Promise<EntityShares> {
  const filePath = getEntitySharesPath(entityId);
  return readJsonFile<EntityShares>(filePath, { outgoing: [], incoming: [] });
}

export async function addOutgoingShare(
  entityId: string,
  share: OutgoingShare
): Promise<void> {
  const shares = await getShares(entityId);
  // Avoid duplicates
  const exists = shares.outgoing.some(
    (s) => s.targetEntityId === share.targetEntityId && s.propertyName === share.propertyName
  );
  if (!exists) {
    shares.outgoing.push(share);
    await writeJsonFile(getEntitySharesPath(entityId), shares);
  }
}

export async function addIncomingShare(
  entityId: string,
  share: IncomingShare
): Promise<void> {
  const shares = await getShares(entityId);
  // Avoid duplicates
  const exists = shares.incoming.some(
    (s) => s.sourceEntityId === share.sourceEntityId && s.propertyName === share.propertyName
  );
  if (!exists) {
    shares.incoming.push(share);
    await writeJsonFile(getEntitySharesPath(entityId), shares);
  }
}

export async function removeOutgoingShare(
  entityId: string,
  targetEntityId: string,
  propertyName: string
): Promise<boolean> {
  const shares = await getShares(entityId);
  const originalLength = shares.outgoing.length;
  shares.outgoing = shares.outgoing.filter(
    (s) => !(s.targetEntityId === targetEntityId && s.propertyName === propertyName)
  );
  if (shares.outgoing.length !== originalLength) {
    await writeJsonFile(getEntitySharesPath(entityId), shares);
    return true;
  }
  return false;
}

export async function removeIncomingShare(
  entityId: string,
  sourceEntityId: string,
  propertyName: string
): Promise<boolean> {
  const shares = await getShares(entityId);
  const originalLength = shares.incoming.length;
  shares.incoming = shares.incoming.filter(
    (s) => !(s.sourceEntityId === sourceEntityId && s.propertyName === propertyName)
  );
  if (shares.incoming.length !== originalLength) {
    await writeJsonFile(getEntitySharesPath(entityId), shares);
    return true;
  }
  return false;
}

// =====================
// Entity Role Storage
// =====================

function getEntityRolePath(entityId: string): string {
  return path.join(entitiesRoot, entityId, "role.json");
}

export async function getEntityRole(entityId: string): Promise<EntityRole | null> {
  const filePath = getEntityRolePath(entityId);
  const data = await readJsonFile<{ role: EntityRole } | null>(filePath, null);
  return data?.role ?? null;
}

export async function setEntityRole(entityId: string, role: EntityRole): Promise<void> {
  await ensureEntityDir(entityId);
  await writeJsonFile(getEntityRolePath(entityId), { role });
}

// =====================
// Entity Public Key Storage
// =====================

function getEntityPublicKeyPath(entityId: string): string {
  return path.join(entitiesRoot, entityId, "public_key.json");
}

export async function getEntityPublicKey(entityId: string): Promise<string | null> {
  const filePath = getEntityPublicKeyPath(entityId);
  const data = await readJsonFile<{ publicKey: string } | null>(filePath, null);
  return data?.publicKey ?? null;
}

export async function setEntityPublicKey(entityId: string, publicKey: string): Promise<void> {
  await ensureEntityDir(entityId);
  await writeJsonFile(getEntityPublicKeyPath(entityId), { publicKey });
}

// =====================
// Transfer Records
// =====================

export async function getTransfers(): Promise<TransferRecord[]> {
  return readJsonFile<TransferMap>(transfersFile, []);
}

export async function addTransferRecord(record: Omit<TransferRecord, "id">): Promise<TransferRecord> {
  const transfers = await getTransfers();
  const newRecord: TransferRecord = {
    ...record,
    id: randomUUID(),
  };
  transfers.push(newRecord);
  await writeJsonFile(transfersFile, transfers);
  return newRecord;
}

export async function getTransfersForEntity(entityId: string): Promise<TransferRecord[]> {
  const transfers = await getTransfers();
  return transfers.filter(
    (t) => t.fromEntityId === entityId || t.toEntityId === entityId
  );
}

// =====================
// Entity Event Storage (for transfers)
// =====================

export async function deleteEntityProperty(entityId: string, propertyKey: string): Promise<void> {
  // This is used during transfers to remove the property from the source entity
  // The actual deletion happens via the event stream, but we need to track it
  const filePath = path.join(entitiesRoot, entityId, `prop_${propertyKey}.json`);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}

// =====================
// Public Profile Storage (for graph labels)
// =====================

// Public profile contains only non-sensitive display info
export type PublicProfileData = {
  displayName: string;
  role: EntityRole;
  subtitle?: string;
  organizationName?: string;
};

function getPublicProfilePath(entityId: string): string {
  return path.join(entitiesRoot, entityId, "public_profile.json");
}

export async function getPublicProfile(entityId: string): Promise<PublicProfileData | null> {
  const filePath = getPublicProfilePath(entityId);
  return readJsonFile<PublicProfileData | null>(filePath, null);
}

export async function setPublicProfile(entityId: string, profile: PublicProfileData): Promise<void> {
  await ensureEntityDir(entityId);
  await writeJsonFile(getPublicProfilePath(entityId), profile);
}

export async function getPublicProfiles(entityIds: string[]): Promise<Record<string, PublicProfileData | null>> {
  const result: Record<string, PublicProfileData | null> = {};
  await Promise.all(
    entityIds.map(async (entityId) => {
      result[entityId] = await getPublicProfile(entityId);
    })
  );
  return result;
}

// =====================
// Data Request Storage
// =====================

const requestsFile = path.join(entitiesRoot, "_requests.json");

export type DataRequestStatus = "pending" | "fulfilled" | "declined";

export type DataRequest = {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  requestedTypes: string[]; // MedicalRecordType values
  message?: string;
  status: DataRequestStatus;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
  declinedAt?: string;
};

type RequestsMap = Record<string, DataRequest>;

export async function createDataRequest(
  request: Omit<DataRequest, "id" | "createdAt" | "updatedAt" | "status">
): Promise<DataRequest> {
  const map = await readJsonFile<RequestsMap>(requestsFile, {});
  const now = new Date().toISOString();
  const newRequest: DataRequest = {
    ...request,
    id: randomUUID(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  map[newRequest.id] = newRequest;
  await writeJsonFile(requestsFile, map);
  return newRequest;
}

export async function getDataRequest(requestId: string): Promise<DataRequest | null> {
  const map = await readJsonFile<RequestsMap>(requestsFile, {});
  return map[requestId] ?? null;
}

export async function getDataRequestsForEntity(entityId: string): Promise<DataRequest[]> {
  const map = await readJsonFile<RequestsMap>(requestsFile, {});
  return Object.values(map).filter((r) => r.toEntityId === entityId);
}

export async function getDataRequestsByEntity(entityId: string): Promise<DataRequest[]> {
  const map = await readJsonFile<RequestsMap>(requestsFile, {});
  return Object.values(map).filter((r) => r.fromEntityId === entityId);
}

export async function updateDataRequestStatus(
  requestId: string,
  status: DataRequestStatus
): Promise<DataRequest | null> {
  const map = await readJsonFile<RequestsMap>(requestsFile, {});
  const request = map[requestId];
  if (!request) return null;
  
  const now = new Date().toISOString();
  request.status = status;
  request.updatedAt = now;
  
  if (status === "fulfilled") {
    request.fulfilledAt = now;
  } else if (status === "declined") {
    request.declinedAt = now;
  }
  
  map[requestId] = request;
  await writeJsonFile(requestsFile, map);
  return request;
}

export async function getAllDataRequests(): Promise<DataRequest[]> {
  const map = await readJsonFile<RequestsMap>(requestsFile, {});
  return Object.values(map);
}
