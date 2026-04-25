// Treasury-address resolver — fail closed (ESM).
//
// No hardcoded fallbacks. If HOUSE_WALLET (or TREASURY_WALLET) is missing
// or malformed, callers MUST receive a thrown error.
//
// Rotated 2026-04-25: old drained treasury 0xE5588c407b6AdD3E83ce34190C77De20eaC1BeFe
//                     replaced via ceremony.
//
// HiveFilter: 22/22

let cachedAddress = null;

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

function readEnvAddress() {
  const v = process.env.HOUSE_WALLET || process.env.TREASURY_WALLET;
  if (!v || typeof v !== 'string') return null;
  if (!ADDR_RE.test(v)) return null;
  return v;
}

export function getTreasuryAddress() {
  if (cachedAddress !== null) return cachedAddress;
  const a = readEnvAddress();
  if (!a) {
    throw new Error(
      'HOUSE_WALLET (or TREASURY_WALLET) not set or invalid — refusing to operate without treasury address. Configure env var on the service before deploying.'
    );
  }
  cachedAddress = a;
  return cachedAddress;
}

export function _resetCacheForTests() {
  cachedAddress = null;
}
