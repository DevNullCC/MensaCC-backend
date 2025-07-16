// api/update.js

import formidable from "formidable";
import fs from "fs";
import { Buffer } from "buffer";

// Disabilita il body parser di Vercel per usare formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST allowed' });
    return;
  }

  // TEST: restituisci subito un OK per vedere se risponde
  res.status(200).json({ message: "API OK!" });
}
