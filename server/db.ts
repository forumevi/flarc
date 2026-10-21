import { Database } from 'bun:sqlite'
import path from 'path'

const DB_PATH = path.join(import.meta.dir, 'flarc.db')

export const db = new Database(DB_PATH)

db.exec('PRAGMA journal_mode=WAL')
db.exec('PRAGMA synchronous=FULL')
db.exec('PRAGMA busy_timeout=5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER NOT NULL,
    trader TEXT NOT NULL,
    side TEXT NOT NULL,
    usdc_amount INTEGER NOT NULL,
    token_amount INTEGER NOT NULL,
    price_usdc REAL NOT NULL,
    block_number INTEGER NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    ts INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_id, ts DESC);
  CREATE INDEX IF NOT EXISTS idx_trades_tx ON trades(tx_hash);

  CREATE TABLE IF NOT EXISTS token_metadata (
    token_id INTEGER PRIMARY KEY,
    description TEXT DEFAULT '',
    twitter TEXT DEFAULT '',
    telegram TEXT DEFAULT '',
    website TEXT DEFAULT '',
    image_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS indexer_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

export function getLastBlock(tokenId?: number): bigint {
  const key = tokenId != null ? 'last_block_' + tokenId : 'last_block'
  const row = db.query<{ value: string }, [string]>(
    'SELECT value FROM indexer_state WHERE key = ?'
  ).get(key)
  return row ? BigInt(row.value) : 0n
}

export function setLastBlock(block: bigint, tokenId?: number) {
  const key = tokenId != null ? 'last_block_' + tokenId : 'last_block'
  db.query('INSERT OR REPLACE INTO indexer_state(key, value) VALUES (?, ?)').run(key, block.toString())
}

export interface Trade {
  id: number
  token_id: number
  trader: string
  side: string
  usdc_amount: number
  token_amount: number
  price_usdc: number
  block_number: number
  tx_hash: string
  ts: number
}

export function insertTrade(t: Omit<Trade, 'id'>) {
  db.query(`
    INSERT OR IGNORE INTO trades
      (token_id, trader, side, usdc_amount, token_amount, price_usdc, block_number, tx_hash, ts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(t.token_id, t.trader, t.side, t.usdc_amount, t.token_amount, t.price_usdc, t.block_number, t.tx_hash, t.ts)
}

export function getTrades(tokenId: number, limit = 50): Trade[] {
  return db.query<Trade, [number, number]>(
    'SELECT * FROM trades WHERE token_id = ? ORDER BY ts DESC LIMIT ?'
  ).all(tokenId, limit)
}

export function getHolders(tokenId: number): { trader: string; net_tokens: number }[] {
  return db.query<{ trader: string; net_tokens: number }, [number]>(`
    SELECT trader,
           SUM(CASE WHEN side='buy' THEN token_amount ELSE -token_amount END) AS net_tokens
    FROM trades WHERE token_id = ?
    GROUP BY trader
    HAVING net_tokens > 0
    ORDER BY net_tokens DESC
  `).all(tokenId)
}

export function getPriceHistory(tokenId: number, limit = 200): { ts: number; price: number }[] {
  return db.query<{ ts: number; price: number }, [number, number]>(
    'SELECT ts, price_usdc AS price FROM trades WHERE token_id = ? ORDER BY ts ASC LIMIT ?'
  ).all(tokenId, limit)
}

export function getStats(tokenId: number): { trade_count: number; holder_count: number; creator_earned: number } {
  const trades = db.query<{ trade_count: number; creator_earned: number }, [number]>(`
    SELECT COUNT(*) AS trade_count, SUM(usdc_amount) * 0.01 AS creator_earned
    FROM trades WHERE token_id = ?
  `).get(tokenId)
  const holders = db.query<{ holder_count: number }, [number]>(`
    SELECT COUNT(*) AS holder_count FROM (
      SELECT trader, SUM(CASE WHEN side='buy' THEN token_amount ELSE -token_amount END) AS net
      FROM trades WHERE token_id = ? GROUP BY trader HAVING net > 0
    )
  `).get(tokenId)
  return {
    trade_count: trades?.trade_count ?? 0,
    holder_count: holders?.holder_count ?? 0,
    creator_earned: trades?.creator_earned ?? 0,
  }
}

export function getTokenMetadata(tokenId: number): { description: string; twitter: string; telegram: string; website: string; image_url: string } {
  return db.query<{ description: string; twitter: string; telegram: string; website: string; image_url: string }, [number]>(
    'SELECT description, twitter, telegram, website, image_url FROM token_metadata WHERE token_id = ?'
  ).get(tokenId) ?? { description: '', twitter: '', telegram: '', website: '', image_url: '' }
}

export function upsertTokenMetadata(tokenId: number, data: Partial<{ description: string; twitter: string; telegram: string; website: string; image_url: string }>) {
  const existing = getTokenMetadata(tokenId)
  const merged = { ...existing, ...data }
  db.query(`
    INSERT OR REPLACE INTO token_metadata (token_id, description, twitter, telegram, website, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tokenId, merged.description, merged.twitter, merged.telegram, merged.website, merged.image_url)
}

export function getTrending(limit = 10): { token_id: number; trade_count: number; usdc_volume: number }[] {
  const since = Math.floor(Date.now() / 1000) - 24 * 3600
  return db.query<{ token_id: number; trade_count: number; usdc_volume: number }, [number, number]>(`
    SELECT token_id, COUNT(*) AS trade_count, SUM(usdc_amount) AS usdc_volume
    FROM trades WHERE ts >= ?
    GROUP BY token_id
    ORDER BY usdc_volume DESC
    LIMIT ?
  `).all(since, limit)
}
