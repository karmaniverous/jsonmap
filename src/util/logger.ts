import _ from 'lodash';
import { type ILogObj, Logger } from 'tslog';

import { packageName } from './packageName';

const logLevel = _.parseInt(process.env.LOG_LEVEL ?? '');

export const logger = new Logger<ILogObj>({
  hideLogPositionForProduction: true,
  minLevel: _.isNaN(logLevel) ? undefined : logLevel,
  name: packageName,
  type: _.isNaN(logLevel) ? 'hidden' : 'pretty',
});
