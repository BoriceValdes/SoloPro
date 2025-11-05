// lib/jsonDb.ts
import fs from 'fs'
import path from 'path'

export type TableName =
  | 'users'
  | 'businesses'
  | 'clients'
  | 'services'
  | 'invoices'
  | 'invoice_items'
  | 'payments'
  | 'appointments'

export type JsonDB = {
  users: any[]
  businesses: any[]
  clients: any[]
  services: any[]
  invoices: any[]
  invoice_items: any[]
  payments: any[]
  appointments: any[]
  _counters: Record<string, number>
}

const defaultDB: JsonDB = {
  users: [],
  businesses: [],
  clients: [],
  services: [],
  invoices: [],
  invoice_items: [],
  payments: [],
  appointments: [],
  _counters: {}
}

const dbDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dbDir, 'db.json')

async function ensureDir(): Promise<void> {
  await fs.promises.mkdir(dbDir, { recursive: true })
}

export async function loadDB(): Promise<JsonDB> {
  await ensureDir()

  try {
    const raw = await fs.promises.readFile(dbPath, 'utf-8')
    const parsed = JSON.parse(raw)

    // On merge avec la structure par défaut pour être sûr que tous les champs existent
    return {
      ...defaultDB,
      ...parsed,
      _counters: {
        ...defaultDB._counters,
        ...(parsed._counters ?? {})
      }
    }
  } catch (err: any) {
    // Si le fichier n'existe pas, on le crée avec la DB vide
    if (err && err.code === 'ENOENT') {
      await saveDB(defaultDB)
      // on renvoie une copie pour éviter toute mutation surprise
      return JSON.parse(JSON.stringify(defaultDB))
    }

    console.error('[jsonDb] loadDB error', err)
    throw err
  }
}

export async function saveDB(db: JsonDB): Promise<void> {
  await ensureDir()
  await fs.promises.writeFile(
    dbPath,
    JSON.stringify(db, null, 2),
    'utf-8'
  )
}

export function nextId(db: JsonDB, table: TableName): number {
  const current = db._counters[table] ?? 0
  const next = current + 1
  db._counters[table] = next
  return next
}
