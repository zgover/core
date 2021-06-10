import * as admin from 'firebase-admin'


export type FbUserRecord = admin.auth.UserRecord

export const initializeServerApp = (): ReturnType<typeof admin.initializeApp> => {
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // https://stackoverflow.com/a/41044630/1332513
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  })
}

if (!admin.apps.length) {
  initializeServerApp()
}

export default admin
