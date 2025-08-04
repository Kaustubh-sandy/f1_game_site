// // src/app/api/upload/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import formidable from 'formidable';
// import fs from 'fs';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// let standings: Record<string, number> = {};

// export async function POST(req: NextRequest) {
//   const formData = await req.formData();
//   const file = formData.get('file') as File;

//   if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

//   const text = await file.text();
//   const lines = text.trim().split('\n');
//   const headers = lines[0].split(',');

//   for (let i = 1; i < lines.length; i++) {
//     const cols = lines[i].split(',');
//     const driver = cols[1];
//     const points = parseInt(cols[2], 10);
//     standings[driver] = (standings[driver] || 0) + points;
//   }

//   const sorted = Object.entries(standings)
//     .sort((a, b) => b[1] - a[1])
//     .map(([driver, points]) => ({ driver, points }));

//   return NextResponse.json(sorted);
// }
