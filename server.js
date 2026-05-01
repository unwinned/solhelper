import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAllPools } from './pools.js';
import { getAllMarkets } from './lending.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'dist')));

const CACHE_LIFETIME = 5 * 60 * 1000;

let poolsCache   = { data: [], lastUpdated: 0 };
let lendingCache = { lend: [], borrow: [], lastUpdated: 0 };

app.get('/api/pools', async (req, res) => {
    try {
        const now = Date.now();
        if (now - poolsCache.lastUpdated < CACHE_LIFETIME && poolsCache.data.length > 0) {
            return res.json({ pools: poolsCache.data, lastUpdated: poolsCache.lastUpdated });
        }

        console.log('refreshing pools data...');
        const allPools = (await getAllPools())
            .filter(p => p.tvl > 10000 && !p.pair.includes('?'));

        const bestMap = new Map();
        allPools.forEach(pool => {
            const key = `${pool.dex}:${pool.pair.split('/').sort().join('/')}`;
            const existing = bestMap.get(key);
            if (!existing || pool.apr > existing.apr) bestMap.set(key, pool);
        });

        poolsCache.data = Array.from(bestMap.values());
        poolsCache.lastUpdated = now;
        console.log(`cached ${poolsCache.data.length} pools.`);
        res.json({ pools: poolsCache.data, lastUpdated: poolsCache.lastUpdated });

    } catch (error) {
        console.error('pool fetch error:', error);
        if (poolsCache.data.length > 0)
            return res.json({ pools: poolsCache.data, lastUpdated: poolsCache.lastUpdated, error: 'Using stale data' });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/lending', async (req, res) => {
    try {
        const now = Date.now();
        if (now - lendingCache.lastUpdated < CACHE_LIFETIME && lendingCache.lend.length > 0) {
            return res.json({ lend: lendingCache.lend, borrow: lendingCache.borrow, lastUpdated: lendingCache.lastUpdated });
        }

        console.log('refreshing lending data...');
        const markets = await getAllMarkets();

        lendingCache.lend      = markets.lend;
        lendingCache.borrow    = markets.borrow;
        lendingCache.lastUpdated = now;
        console.log(`cached ${lendingCache.lend.length} lend + ${lendingCache.borrow.length} borrow markets.`);
        res.json({ lend: lendingCache.lend, borrow: lendingCache.borrow, lastUpdated: lendingCache.lastUpdated });

    } catch (error) {
        console.error('lending error:', error);
        if (lendingCache.lend.length > 0)
            return res.json({ lend: lendingCache.lend, borrow: lendingCache.borrow, lastUpdated: lendingCache.lastUpdated, error: 'Using stale data' });
        res.status(500).json({ error: 'server error' });
    }
});

app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`server running at http://localhost:${PORT}`));
