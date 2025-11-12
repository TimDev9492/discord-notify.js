export {};

declare global {
  interface Config {
    message: string;
  }

  interface Environment {
    dev: Config;
    prod: Config;
  }
}
