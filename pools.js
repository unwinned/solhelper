import axios from 'axios';

const UA = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const DEXES = [
  {
    name: 'Raydium',
    url: 'https://api-v3.raydium.io/pools/info/list-v2?sortType=desc&size=100',
    headers: { 'User-Agent': UA, 'Accept': 'application/json, text/plain, */*' },
    parse(data) {
      const sym = s => (s || '?').replace(/^WSOL$/i, 'SOL');
      return data.data.data
        .filter(p => p.tvl > 50000)
        .map(p => ({
          dex: 'Raydium',
          pair: `${sym(p.mintA?.symbol)}/${sym(p.mintB?.symbol)}`,
          tvl: parseFloat(p.tvl) || 0,
          apr: parseFloat(p.week?.apr) || 0,
          vol7d: parseFloat(p.week?.volume) || 0,
          address: p.id,
        }));
    },
  },
  {
    name: 'Orca',
    url: 'https://api.orca.so/v2/solana/pools?sortBy=tvlUsdc&sortDirection=desc&limit=200&stats=24H,7D&minTvl=20000',
    headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    parse(data) {
      const sym = s => (s || '?').replace(/^WSOL$/i, 'SOL');
      return data.data.map(p => ({
        dex: 'Orca',
        pair: `${sym(p.tokenA?.symbol)}/${sym(p.tokenB?.symbol)}`,
        tvl: parseFloat(p.tvlUsdc) || 0,
        apr: (parseFloat(p.yieldOverTvl) * 100) || 0,
        vol7d: parseFloat(p.stats?.['7d']?.volume) || 0,
        address: p.address || p.id,
      }));
    },
  },
  {
    name: 'Meteora',
    url: 'https://pool-discovery-api.datapi.meteora.ag/pools?page_size=200&timeframe=24h&category=top',
    headers: { 'User-Agent': UA, 'Accept': 'application/json, text/plain, */*' },
    parse(data) {
      const sym = s => (s || '?').replace(/^WSOL$/i, 'SOL');
      return data.data
        .filter(p => p.tvl > 20000)
        .map(p => ({
          dex: 'Meteora',
          pair: `${sym(p.token_x?.symbol)}/${sym(p.token_y?.symbol)}`,
          tvl: parseFloat(p.tvl) || 0,
          apr: parseFloat(p.apr) || 0,
          vol7d: parseFloat(p.volume) || 0,
          address: p.pool_address,
        }));
    },
  },
];


async function fetchKaminoVol7d(address, headers) {
  try {
    const res = await axios.get(
      `https://api.kamino.finance/strategies/${address}/metrics/history`,
      { headers, timeout: 8000 }
    );
    const history = res.data;
    if (!Array.isArray(history) || history.length === 0) return 0;
    return history.slice(-7).reduce((sum, d) => sum + (parseFloat(d.volume24hUsd) || 0), 0);
  } catch {
    return 0;
  }
}

async function fetchKaminoPools() {
  const headers = { 'User-Agent': UA, 'Accept': 'application/json' };
  console.log('fetching Kamino pools...');
  const res = await axios.get('https://api.kamino.finance/strategies/metrics?status=LIVE', { headers });
  const filtered = res.data.filter(p => parseFloat(p.totalValueLocked) > 20000);

  console.log(`fetching Kamino 7d volume for ${filtered.length} strategies...`);
  const BATCH = 10;
  const volumes = [];
  for (let i = 0; i < filtered.length; i += BATCH) {
    const batch = filtered.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(p => fetchKaminoVol7d(p.strategy, headers)));
    volumes.push(...results.map(r => r.status === 'fulfilled' ? r.value : 0));
  }

  return filtered.map((p, i) => ({
    dex: 'Kamino',
    pair: `${p.tokenA || '?'}/${p.tokenB || '?'}`,
    tvl: parseFloat(p.totalValueLocked) || 0,
    apr: (parseFloat(p.kaminoApy?.vault?.apr7d) * 100) || 0,
    vol7d: volumes[i] || 0,
    address: p.strategy,
  }));
}


export async function getAllPools() {
  const results = await Promise.allSettled([
    ...DEXES.map(async dex => {
      console.log(`fetching ${dex.name} pools...`);
      const r = await axios.get(dex.url, { headers: dex.headers });
      return dex.parse(r.data);
    }),
    fetchKaminoPools(),
  ]);

  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}
