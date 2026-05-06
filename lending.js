import axios from 'axios';

const UA = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, 'Accept': 'application/json' };
const MIN_TVL = 100_000;

const KNOWN_ASSETS = new Set([
  'SOL', 'USDC', 'USDT', 'USDS', 'CASH', 'USD1', 'PYUSD', 'USDG',
  'MSOL', 'JITOSOL', 'BSOL', 'JLP', 'JTO', 'JUP',
  'BTC', 'ETH', 'WBTC', 'CBBTC', 'BONK', 'WIF',
]);


const MINT_SYMBOL = {
  'So11111111111111111111111111111111111111112':  'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA':  'USDS',
  'CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH': 'CASH',
  'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB':  'USD1',
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo': 'PYUSD',
  '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH': 'USDG',
};

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function fetchVaultMetrics(address) {
  try {
    const res = await axios.get(
      `https://api.kamino.finance/kvaults/vaults/${address}/metrics`,
      { headers: HEADERS, timeout: 10000 }
    );
    return res.data;
  } catch {
    return null;
  }
}

async function fetchKaminoVaults() {
  const res = await axios.get('https://api.kamino.finance/kvaults/vaults', { headers: HEADERS, timeout: 15000 });

  const active = res.data.filter(v =>
    MINT_SYMBOL[v.state?.tokenMint] &&
    v.state?.name?.trim()
  );

  const results = [];
  for (let i = 0; i < active.length; i += 5) {
    const batch = active.slice(i, i + 5);
    const settled = await Promise.allSettled(batch.map(v => fetchVaultMetrics(v.address)));
    results.push(...settled);
  }

  return active
    .map((v, i) => {
      const m = results[i]?.status === 'fulfilled' ? results[i].value : null;
      if (!m) return null;
      const tvl = (parseFloat(m.tokensInvestedUsd) || 0) + (parseFloat(m.tokensAvailableUsd) || 0);
      if (tvl < MIN_TVL) return null;
      return {
        protocol: 'Kamino',
        asset: MINT_SYMBOL[v.state.tokenMint],
        supplyApy: (parseFloat(m.apy) * 100) || 0,
        borrowApy: 0,
        tvl,
        address: slugify(v.state.name),
      };
    })
    .filter(Boolean);
}


const KAMINO_MARKET = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';

async function fetchKaminoBorrowMarkets() {
  const res = await axios.get(
    `https://api.kamino.finance/kamino-market/${KAMINO_MARKET}/reserves/metrics`,
    { headers: HEADERS }
  );
  return (res.data || [])
    .filter(r => parseFloat(r.totalSupplyUsd) > MIN_TVL && parseFloat(r.borrowApy) > 0)
    .map(r => ({
      protocol: 'Kamino',
      asset: r.liquidityToken,
      supplyApy: (parseFloat(r.supplyApy) * 100) || 0,
      borrowApy: (parseFloat(r.borrowApy) * 100) || 0,
      tvl: parseFloat(r.totalSupplyUsd) || 0,
      address: `${r.reserve}/${KAMINO_MARKET}`,
    }));
}


async function fetchJupiterBorrowMarkets() {
  const res = await axios.get('https://api.jup.ag/lend/v1/borrow/vaults', { headers: HEADERS });
  const vaults = res.data || [];

  const best = new Map();
  for (const v of vaults) {
    const asset = v.borrowToken?.toUpperCase();
    if (!KNOWN_ASSETS.has(asset)) continue;
    const apy = (v.borrowRate || 0) / 100;
    if (apy <= 0) continue;
    const existing = best.get(asset);
    if (!existing || apy < existing.borrowApy) {
      best.set(asset, {
        protocol: 'Jupiter Lend',
        asset,
        supplyApy: 0,
        borrowApy: apy,
        tvl: 0,
        address: null,
      });
    }
  }
  return Array.from(best.values());
}


const LLAMA_PROTOCOLS = {
  'jupiter-lend':     'Jupiter Lend',
  'drift-staked-sol': 'Drift',
  'marginfi':         'MarginFi',
  'solend':           'Save',
  'mango-v4':         'Mango',
};

async function fetchLlamaMarkets() {
  const res = await axios.get('https://yields.llama.fi/pools', { headers: HEADERS });
  return (res.data.data || [])
    .filter(p =>
      p.chain === 'Solana' &&
      LLAMA_PROTOCOLS[p.project] &&
      KNOWN_ASSETS.has(p.symbol?.toUpperCase()) &&
      (p.tvlUsd || 0) > MIN_TVL &&
      (p.apy || 0) > 0
    )
    .map(p => ({
      protocol: LLAMA_PROTOCOLS[p.project],
      asset: p.symbol.toUpperCase(),
      supplyApy: parseFloat(p.apy) || 0,
      borrowApy: 0,
      tvl: parseFloat(p.tvlUsd) || 0,
      address: null,
    }));
}


export async function getAllMarkets() {
  console.log('fetching lending markets...');
  const [vaults, kaminoBorrow, jupBorrow, llama] = await Promise.allSettled([
    fetchKaminoVaults(),
    fetchKaminoBorrowMarkets(),
    fetchJupiterBorrowMarkets(),
    fetchLlamaMarkets(),
  ]);

  const vaultData     = vaults.status     === 'fulfilled' ? vaults.value     : [];
  const kaminoBorData = kaminoBorrow.status === 'fulfilled' ? kaminoBorrow.value : [];
  const jupBorData    = jupBorrow.status   === 'fulfilled' ? jupBorrow.value   : [];
  const llamaData     = llama.status       === 'fulfilled' ? llama.value       : [];

  return {
    lend:   [...vaultData, ...llamaData].sort((a, b) => b.tvl - a.tvl),
    borrow: [...kaminoBorData, ...jupBorData].sort((a, b) => b.tvl - a.tvl),
  };
}
