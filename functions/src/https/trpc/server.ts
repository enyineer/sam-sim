import { initTRPC } from '@trpc/server';
import { Context } from './context';
import { stationRouter } from './routers/station';

export const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  stations: stationRouter,
});

export type AppRouter = typeof appRouter;