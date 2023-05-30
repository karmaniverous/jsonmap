/* eslint-env mocha */

import { getDotenv } from '@karmaniverous/get-dotenv';

before(async function () {
  if (!process.env.ENV)
    await getDotenv({
      dynamicPath: './env/dynamic.js',
      env: 'dev',
      loadProcess: true,
      paths: ['./', './env'],
    });
});
