import * as got from "got";
import { createPoller } from "./poller";

export interface GasPrices {
  slow: number;
  normal: number;
  fast: number;
}

export async function fetchGasValues(): Promise<GasPrices> {
  const res = await got.get("https://dev.blockscale.net/api/gasexpress.json", {
    json: true
  });
  return {
    slow: res.body.safeLow,
    normal: res.body.fast,
    fast: res.body.fastest
  };
}

const POLL_WAIT = 1000 * 60;
const gasValuePoller = createPoller(fetchGasValues, POLL_WAIT);

export async function getGasPrices() {
  return gasValuePoller.currentValue;
}

export function stopPoller() {
  gasValuePoller.stop();
}
