function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class Poller<T> {
  private _currentValue: null | T = null;
  private active = false;

  constructor(private fn: () => Promise<T>, private waitMS: number) {
    this.start();
  }

  get currentValue(): T {
    if (!this._currentValue) {
      throw new Error("missing value");
    }
    return this._currentValue;
  }

  async start() {
    this.active = true;
    while (this.active) {
      try {
        this._currentValue = await this.fn();
        await delay(this.waitMS);
      } catch (err) {
        // TODO log
        // TODO handle consecutive errors
        // ignore error
      }
    }
  }

  stop() {
    this.active = false;
  }
}

export function createPoller<T>(fn: () => Promise<T>, waitMS: number) {
  return new Poller(fn, waitMS);
}
