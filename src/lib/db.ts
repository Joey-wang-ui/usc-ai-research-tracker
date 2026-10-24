import { openDB } from "idb";
import { stateSchema, type AppState } from "../types";
import { createSeed } from "../data/seed";
const connection = () =>
  openDB("usc-research-tracker", 1, {
    upgrade(db) {
      db.createObjectStore("workspace");
    },
  });
export async function readState(): Promise<AppState> {
  const db = await connection();
  try {
    const tx = db.transaction("workspace", "readwrite");
    const stored = await tx.store.get("state");
    if (stored !== undefined) {
      await tx.done;
      return stateSchema.parse(stored);
    }
    const initial = stateSchema.parse(createSeed());
    await tx.store.put(initial, "state");
    await tx.done;
    return initial;
  } finally {
    db.close();
  }
}
export async function writeState(state: AppState) {
  const parsed = stateSchema.parse(state);
  const db = await connection();
  try {
    await db.put("workspace", parsed, "state");
  } finally {
    db.close();
  }
}
