import { auth } from "../config/firebase";

export const getInitialsAvatarUrl = (user, size = 96) => {
  const label = user?.fullName || user?.username || user?.email || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=0f172a&color=22d3ee&bold=true&size=${size}`;
};

/** Profile image from Google/backend, Firebase session, or generated initials. */
export const getUserAvatarUrl = (user, { size = 96, skipPhoto = false } = {}) => {
  if (!skipPhoto) {
    if (user?.photoURL) return user.photoURL;
    const firebasePhoto = auth?.currentUser?.photoURL;
    if (firebasePhoto) return firebasePhoto;
  }
  return getInitialsAvatarUrl(user, size);
};
