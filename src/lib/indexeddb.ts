'use client'

import { openDB, IDBPDatabase } from 'idb'

const DB_NAME = 'vow-builder'
const STORE = 'pending-recordings'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
        }
      },
    })
  }
  return dbPromise
}

export async function saveRecordingLocally(key: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put(STORE, blob, key)
}

export async function getLocalRecording(key: string): Promise<Blob | undefined> {
  const db = await getDB()
  return db.get(STORE, key)
}

export async function deleteLocalRecording(key: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, key)
}

export async function getAllLocalRecordingKeys(): Promise<string[]> {
  const db = await getDB()
  const keys = await db.getAllKeys(STORE)
  return keys.map((k) => String(k))
}
