import { FastifyInstance } from "fastify";
import * as httpErrors from "http-errors";
import { getOrderbook, getTokens, Token } from "./order-book-service";
import { BN } from "bn.js";

// @ts-ignore
import numberToBN from "number-to-bn";
import { getEthStats } from "./eth-stats-store";
import { getGasPrices, GasPrices } from "./gas-prices-store";
// import pino from 'pino';

// const logger = pino();

export interface WidgetConfig {
  feePercentage: number;
  ethers2usdER: number;
  gasprices: GasPrices;
  tokens: Token[];
}

export async function getWidgetConfig(widgetId: string): Promise<WidgetConfig> {
  const tokens = await getTokens();
  const ethStats = await getEthStats();
  const gasPrices = await getGasPrices();

  return {
    feePercentage: 0.005,
    ethers2usdER: ethStats.priceUSD,
    gasprices: gasPrices,
    tokens: tokens
  };
}

export default async function setup(fastify: FastifyInstance) {
  fastify.get(
    "/widget/:widgetId",
    {
      schema: {
        params: {
          widgetId: { type: "string" }
        }
      }
    },
    async (req, reply) => {
      try {
        return await getWidgetConfig(req.params.widgetId);
      } catch (err) {
        if (err.code === "22P02") {
          return new httpErrors.NotFound();
        } else {
          throw err;
        }
      }
    }
  );

  fastify.get("/tokens", async (req, reply) => {
    return getTokens();
  });

  fastify.get(
    "/orderbook/:tokenSymbol",
    {
      schema: {
        params: {
          tokenSymbol: { type: "string" }
        }
      }
    },
    async (req, reply) => {
      return getOrderbook(`${req.params.tokenSymbol}-ETH`);
    }
  );

  // fastify.get(
  //   '/trade/:tkAddress/:operation',
  //   {
  //     schema: {
  //       params: {
  //         tkAddress: { type: 'string' },
  //         operation: { enum: ['buys', 'sells'] },
  //       },
  //       querystring: {
  //         volume: { type: 'string' },
  //       },
  //     },
  //   },
  //   async (req, reply) => {
  //     const tkAddress = req.params.tkAddress;
  //     const operation: 'buys' | 'sells' = req.params.operation;
  //     const volume: BN = numberToBN(req.query.volume);

  //     return computeTrade(tkAddress, operation, volume);
  //   }
  // );
}
