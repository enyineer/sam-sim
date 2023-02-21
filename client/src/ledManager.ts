import { Gpio } from "onoff";
import chalk from "chalk";

enum LEDState {
  ON,
  OFF,
}

export class LEDManager {
  private readonly ledPins: Gpio[];
  private readonly ledDuration: number;
  private readonly flashDuration: number;

  private isFlashing: boolean;
  private currentInterval: ReturnType<typeof setInterval> | null;
  private ledState: LEDState;

  constructor() {
    const ledPins = process.env.LED_PINS;
    const ledDuration = process.env.LED_DURATION;

    if (ledPins === undefined) {
      this.ledPins = [];
      console.info('LED_PINS was not set in .env - LEDs won\'t flash on new alerts.');
    } else {
      this.ledPins = ledPins.split(',').map(el => {
        const parsedEl = parseInt(el);

        if (Number.isNaN(parsedEl)) {
          throw new Error(`LED_PINS contains non numeric element ${el}.`);
        }

        return new Gpio(parsedEl, 'out');
      });
    }

    if (ledDuration === undefined) {
      const DEFAULT_LED_DURATION = 30;
      console.info(`LED_DURATION was not set in .env - Setting to default duration of ${DEFAULT_LED_DURATION} seconds.`);
      this.ledDuration = DEFAULT_LED_DURATION;
    } else {
      const parsedEl = parseInt(ledDuration);

      if (Number.isNaN(parsedEl)) {
        throw new Error(`LED_DURATION is non numeric ${ledDuration}`);
      }

      this.ledDuration = parsedEl;
    }

    this.flashDuration = 0.5;
    this.isFlashing = false;
    this.currentInterval = null;
    this.ledState = LEDState.OFF;

    this.reset();

    process.once('SIGTERM', () => this.reset());
    process.once('SIGINT', () => this.reset());
  }

  async startFlashing() {
    if (this.isFlashing) {
      this.reset();
    }

    this.isFlashing = true;

    let remainingCycles = this.ledDuration / this.flashDuration;

    console.debug(`Starting LED Flashing with ${remainingCycles} cycles`);

    this.currentInterval = setInterval(async () => {
      if (remainingCycles <= 0) {
        await this.reset();
        return;
      }

      await this.setLeds(this.ledState === LEDState.ON ? LEDState.OFF : LEDState.ON);

      remainingCycles--;
    }, this.flashDuration * 1000);
  }

  async reset() {
    console.debug(`Resetting LEDs`);
    if (this.currentInterval !== null) {
      clearInterval(this.currentInterval);
    }
    await this.setLeds(LEDState.OFF);
    this.isFlashing = false;
  }

  private async setLeds(state: LEDState) {
    console.debug(`Setting LEDs states to: ${state === LEDState.ON ? chalk.green('ON') : chalk.red('OFF')}`)
    for (const led of this.ledPins) {
      // Do not await write for faster execution
      led.write(LEDState.ON ? 1 : 0);
    }
    this.ledState = state;
  }
}