import { createTRPCReact } from '@trpc/react-query';
import { AppRouter } from '../../../functions/src/https/trpc/server';

export const trpc = createTRPCReact<AppRouter>();