import sharp from 'sharp';
import { resolve } from 'path';

const base = resolve('public/Flower Photos');

async function stats(filename) {
  const s = await sharp(`${base}/${filename}`).stats();
  const c = s.channels;
  console.log(`${filename}: R:${Math.round(c[0].mean)} G:${Math.round(c[1].mean)} B:${Math.round(c[2].mean)}`);
}

await stats('SubscriptionEdit.jpg');
await stats('MothersDayEdit.jpg');
await stats('Wedding Flowers 3.jpg');
await stats('sympathy.jpeg');
