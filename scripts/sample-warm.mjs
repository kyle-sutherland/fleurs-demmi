import sharp from 'sharp';
import { resolve } from 'path';

async function findWarmTones(filename) {
  const img = sharp(resolve('public/Flower Photos/' + filename));
  const { width, height, channels } = await img.metadata();
  const raw = await img.raw().toBuffer();
  const ch = channels ?? 3;

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < raw.length; i += ch) {
    const r = raw[i], g = raw[i+1], b = raw[i+2];
    // warm/orange: R dominant, G moderate, B low
    if (r > 160 && r > g + 30 && r > b + 60) {
      rSum += r; gSum += g; bSum += b; count++;
    }
  }
  if (count > 0) {
    const r = Math.round(rSum/count), g = Math.round(gSum/count), b = Math.round(bSum/count);
    console.log(`${filename} warm pixels (${count}): R:${r} G:${g} B:${b} → #${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
  } else {
    console.log(`${filename}: no warm pixels found`);
  }
}

await findWarmTones('contact.jpg');
await findWarmTones('SubscriptionEdit.jpg');
await findWarmTones('MothersDayEdit.jpg');
