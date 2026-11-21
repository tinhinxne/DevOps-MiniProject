import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

export async function openDb() {
  const db = await SQLite.openDatabaseAsync('medtrack.db');
  await db.execAsync('PRAGMA foreign_keys = ON;'); // à chaque ouverture

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if (!row || row.user_version < 1) {      // première installation
    await db.execAsync(SCHEMA);
    await db.execAsync('PRAGMA user_version = 1;');
  }
  return db;
}