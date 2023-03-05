import * as express from "express";
import * as cors from "cors";
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './trpc/server';
import { createContext } from './trpc/context';

export const app = express();

app.use(cors({ origin: true }));
app.use(
  '/',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createContext,
  }),
);