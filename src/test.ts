import { environment } from './config/config';

console.log(`Log directory: ${(environment[process.env.ENV as keyof typeof environment].LOG_DIRECTORY)}`);
