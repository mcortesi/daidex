const chalk = require('chalk');
const Table = require('cli-table');
const path = require('path');

function info(...args) {
  console.log(...args);
}

function error(...args) {
  if (args.length === 1 && args[0] instanceof Error) {
    console.error(args[0]);
  } else {
    console.error(chalk.red(...args));
  }
}

async function runTask(name, fn, ...args) {
  try {
    console.info(chalk`{cyan Task: ${name} }`);
    const res = await fn(...args);
    console.info(chalk`{cyan Task: ${name} }{yellow [DONE]}`);
    return res;
  } catch (err) {
    console.error(chalk`{cyan Task: ${name} }{yellow [FAILED] (${err.message})} `);
    console.error(err);
    throw err;
  }
}

function withConnections(fn) {
  const db = require('es-core/dist/connections/postgres').default;
  const redis = require('es-core/dist/connections/redis').default;
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error(err);
      process.abort(1);
    } finally {
      await db.$pool.end();
      await redis.quit();
    }
  };
}

async function runCmd(cmdFilename, fn) {
  const cmdName = path.basename(cmdFilename, '.js').replace('dexdex-', '');

  const db = require('es-core/dist/connections/postgres').default;
  const redis = require('es-core/dist/connections/redis').default;
  try {
    console.info(chalk`{cyan command:} {red ${cmdName}}`);
    await fn();
    console.log(chalk`{cyan command:} {red ${cmdName}} {yellow [DONE]}`);
  } catch (err) {
    console.error(chalk`{cyan command:} {red ${cmdName}} {yellow [FAILED] (${err.message})} `);
    process.abort(1);
  } finally {
    await db.$pool.end();
    await redis.quit();
  }
}

const fail = msg => {
  error(msg);
  process.abort();
};

const assert = (condition, msg) => {
  if (!condition) {
    fail(msg);
  }
};

const table = (keys, rows) => {
  const table = new Table({
    head: keys,
  });

  table.push(...rows.map(row => keys.map(k => row[k])));
  info(table.toString());
};

const printValueMap = (title, valueMap) => {
  info(title, ...Object.keys(valueMap).map(key => chalk`${key}: {yellow ${valueMap[key]}}`));
};

function printVTable(valueMap) {
  const table = new Table();
  Object.keys(valueMap).forEach(key => {
    table.push({ [key]: valueMap[key] });
  });
  info(table.toString());
}

module.exports.info = info;
module.exports.error = error;
module.exports.runTask = runTask;
module.exports.runCmd = runCmd;
module.exports.fail = fail;
module.exports.assert = assert;
module.exports.table = table;
module.exports.withConnections = withConnections;
module.exports.printValueMap = printValueMap;
module.exports.printVTable = printVTable;
