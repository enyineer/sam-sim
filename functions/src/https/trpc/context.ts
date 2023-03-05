import { inferAsyncReturnType } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { Request } from 'express';
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const getUserFromToken = async (req: Request) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return null;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    functions.logger.error('Error while verifying Firebase ID token:', error);
    return null;
  }
}

// created for each request
export const createContext = async ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  return {
    user: await getUserFromToken(req),
  }
};

export type Context = inferAsyncReturnType<typeof createContext>;