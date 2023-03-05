import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import { getStationRouter } from './routers/station';

const t = initTRPC.context<Context>().create();

// Need to do some shenanigans with routers defined in external files
// Firebase functions can't deploy otherwise
export type TRPCInstance = typeof t;

const isAuthed = t.middleware(({ next, ctx }) => {
  if (ctx.user === null) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sie müssen angemeldet sein um diese Funktion zu verwenden' });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// you can reuse this for any procedure
export const protectedProcedure = t.procedure.use(isAuthed);

export const appRouter = t.router({
  stations: getStationRouter(t),
});

export type AppRouter = typeof appRouter;