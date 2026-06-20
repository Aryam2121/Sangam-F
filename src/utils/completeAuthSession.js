import { saveFcmToken } from "../services/sangamApi";
import { generateFcmToken } from "../config/firebase";

export const completeAuthSession = async ({ login, user, fcmToken }) => {
  login(user, 24 * 60 * 60 * 1000);

  try {
    const token = fcmToken || (await generateFcmToken());
    if (token) {
      await saveFcmToken(token);
    }
  } catch {
    /* push optional */
  }
};
