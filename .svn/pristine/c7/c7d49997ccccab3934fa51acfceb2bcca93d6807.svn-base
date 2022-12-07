import {ISessInfo} from './server/mongo-schema';

declare module 'koa' {
  // eslint-disable-next-line no-unused-vars
  interface ExtendableContext {
    session?: ISessInfo;
  }
  // eslint-disable-next-line no-unused-vars
  interface Context {
    session?: ISessInfo;
  }
  // eslint-disable-next-line no-unused-vars
  interface Request {
    body: any;
    rawBody: string;
  }
}

