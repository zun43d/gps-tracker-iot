// pages/api/gps.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

type Data = {
  success?: boolean;
  id?: string | null;
  error?: string;
};

// Initialize Firebase Admin if it hasn't been initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines with actual newlines for the private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract lat and lng from the request body
    const { lat, lng } = req.body;

    if (typeof lat === 'undefined' || typeof lng === 'undefined') {
      return res
        .status(400)
        .json({ error: 'Missing "lat" or "lng" in the request body' });
    }

    // Reference to the Firebase Realtime Database (adjust the path as needed)
    const db = admin.database();
    const ref = db.ref('gpsData'); // This will store all entries under "gpsData"

    // Push a new entry with a timestamp
    const newEntryRef = ref.push();
    await newEntryRef.set({
      lat,
      lng,
      timestamp: Date.now(),
    });

    // Return a successful response
    return res.status(200).json({ success: true, id: newEntryRef.key });
  } catch (error) {
    console.error('Error writing to Firebase:', error);
    return res.status(500).json({ error: 'Failed to save data' });
  }
}
