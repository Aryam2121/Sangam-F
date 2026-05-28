import { saveFcmToken } from "../services/sangamApi";
import { generateFcmToken } from "../config/firebase";

export const completeAuthSession = async ({ login, accessToken, user, fcmToken }) => {
  login(accessToken, user, 24 * 60 * 60 * 1000);

  try {
    const token = fcmToken || (await generateFcmToken());
    if (token) {
      await saveFcmToken(token);
    }
  } catch {
    /* push optional */
  }
};
