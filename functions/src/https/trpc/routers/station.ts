import { protectedProcedure } from '../auth';
import { t } from '../server';
import { z } from "zod";
import { DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import * as admin from "firebase-admin";
import { TRPCError } from '@trpc/server';

export const stationRouter = t.router({
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
          message: `No user with email ${input.email} registered`,
        });
      }

      if (ownerIds.includes(targetUser.uid)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `User with email ${input.email} is already an owner of this station`,
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
      const {docRef, data} = await getStationForOwner({
        stationId: input.stationId,
        user: ctx.user,
      });

      let ownerIds: string[] = data.ownerIds;

      if (!ownerIds.includes(input.uid)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `User with uid ${input.uid} is not an owner of this station`,
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
      message: `Could not find station ${params.stationId}`
    });
  }
  
  const data = doc.data();

  if (data === undefined) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Doc data for station ${params.stationId} is undefined`
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