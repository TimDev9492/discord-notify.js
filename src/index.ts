import { environment } from './config/config';

let config: Config;
if (!process.env.ENV || !(process.env.ENV in environment)) {
  console.log('ERROR');
  process.exit(1);
} else {
    config = environment[process.env.ENV as keyof typeof environment];
    console.log(config.message);
}
