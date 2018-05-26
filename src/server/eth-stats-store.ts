import * as got from "got";
import { createPoller } from "./poller";

export interface EthStats {
  priceUSD: number;
}

export async function fetchEthStats(): Promise<EthStats> {
  const res = await got.get(
    "https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD",
    {
      json: true
    }
  );
  return {
    priceUSD: Number(res.body[0].price_usd)
  };
}

const POLL_WAIT = 1000 * 60;
const ethStatsPoller = createPoller(fetchEthStats, POLL_WAIT);

export async function getEthStats() {
  return ethStatsPoller.currentValue;
}

export function stopPoller() {
  ethStatsPoller.stop();
}
