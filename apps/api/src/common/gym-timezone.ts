import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TIME_ZONE } from './date.utils';

export interface GymTimezoneAndCurrency {
  timezone: string;
  currency: string;
}

function resolveTimezone(value?: string | null): string {
  const timezone = value?.trim() || DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone });

    return timezone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export async function getGymTimezoneAndCurrency(
  prisma: PrismaService,
  gymId: string,
): Promise<GymTimezoneAndCurrency> {
  const gym = await prisma.gym.findFirst({
    where: {
      id: gymId,
    },
    select: {
      timezone: true,
      currency: true,
    },
  });

  return {
    timezone: resolveTimezone(gym?.timezone),
    currency: gym?.currency?.trim() || 'PEN',
  };
}

export async function getGymTimezone(
  prisma: PrismaService,
  gymId: string,
): Promise<string> {
  const gym = await prisma.gym.findFirst({
    where: {
      id: gymId,
    },
    select: {
      timezone: true,
    },
  });

  return resolveTimezone(gym?.timezone);
}
