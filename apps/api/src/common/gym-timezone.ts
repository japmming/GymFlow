import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TIME_ZONE } from './date.utils';

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

  const timezone = gym?.timezone?.trim() || DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone });

    return timezone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
