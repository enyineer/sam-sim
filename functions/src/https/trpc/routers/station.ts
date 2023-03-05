import { protectedProcedure, TRPCInstance } from '../server';
import { z } from "zod";
import { DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import * as admin from "firebase-admin";
import { TRPCError } from '@trpc/server';

export const getStationRouter = (trpc: TRPCInstance) => trpc.router({
  getOwners: protectedProcedure
    .input(
      z.object({
        stationId: z.string().min(1),
      })
    )
    .query(async ({ input, ctx }) => {
      const {data} = await getStationForOwner({
        stationId: input.stationId,
        user: ctx.user,
      });

      const ownerIds: string[] = data.ownerIds;
      const ownerUsers: {
        email?: string,
        displayName?: string,
        uid: string,
      }[] = [];

      for (const ownerId of ownerIds) {
        try {
          const user = await admin.auth().getUser(ownerId);
          ownerUsers.push({
            email: user.email,
            displayName: user.displayName,
            uid: user.uid,  
          });
        } catch (err) {
          ownerUsers.push({
            email: 'Nutzer gelöscht',
            displayName: 'Nutzer gelöscht',
            uid: ownerId,
          });
        }
      }

      return {
        ownerUsers,
      }
    }),
  addOwner: protectedProcedure
    .input(
      z.object({
        stationId: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({input, ctx}) => {
      const {docRef, data} = await getStationForOwner({
        stationId: input.stationId,
        user: ctx.user,
      });

      const ownerIds: string[] = data.ownerIds;

      let targetUser: UserRecord;

      try {
        targetUser = await admin.auth().getUserByEmail(input.email);
      } catch (err) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Kein Nutzer mit email ${input.email} registriert`,
        });
      }

      if (ownerIds.includes(targetUser.uid)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Nutzer mit email ${input.email} ist bereits Inhaber`,
        });
      }

      ownerIds.push(targetUser.uid);

      await docRef.update({
        ...data,
        ownerIds,
      });

      return {
        ownerIds,
      }
    }),
  deleteOwner: protectedProcedure
    .input(
      z.object({
        stationId: z.string().min(1),
        uid: z.string().min(1),
      })
    )
    .mutation(async ({input, ctx}) => {
      if (input.uid === ctx.user.uid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sie können Sich nicht selbst entfernen',
        });
      }
      
      const {docRef, data} = await getStationForOwner({
        stationId: input.stationId,
        user: ctx.user,
      });

      let ownerIds: string[] = data.ownerIds;

      if (!ownerIds.includes(input.uid)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Nutzer mit der ID ${input.uid} ist kein Inhaber der Station`,
        });
      }

      ownerIds = ownerIds.filter(el => el !== input.uid);

      await docRef.update({
        ...data,
        ownerIds,
      });

      return {
        ownerIds,
      }
    })
});

const getStationForOwner = async (params: {
  stationId: string;
  user: DecodedIdToken;
}) => {
  const docRef = admin.firestore().doc(`stations/${params.stationId}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Konnte Wache ${params.stationId} nicht finden`
    });
  }
  
  const data = doc.data();

  if (data === undefined) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Daten für Wache ${params.stationId} sind undefiniert`
    });
  }

  const ownerIds = data.ownerIds;

  if (!ownerIds.includes(params.user.uid)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `No permissions to edit station ${params.stationId}`
    });
  }
  
  return {
    docRef,
    data,
  };
}