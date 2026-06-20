/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

firebase.initializeApp(self.FIREBASE_CONFIG);
firebase.messaging();
