import { TRPCError } from '@trpc/server';
import { t } from './server';

const isAuthed = t.middleware(({ next, ctx }) => {
  if (ctx.user === null) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// you can reuse this for any procedure
export const protectedProcedure = t.procedure.use(isAuthed);