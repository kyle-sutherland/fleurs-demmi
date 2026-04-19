import sharp from 'sharp';
import { resolve } from 'path';

const img = sharp(resolve('public/Flower Photos/contact.jpg'));
const { width, height } = await img.metadata();

// Sample a patch of warm flower tones from the centre of the image
const s = await img.stats();
const c = s.channels;
console.log(`Full image mean: R:${Math.round(c[0].mean)} G:${Math.round(c[1].mean)} B:${Math.round(c[2].mean)}`);

// Extract a centre crop where flowers likely are
const crop = await sharp(resolve('public/Flower Photos/contact.jpg'))
  .extract({ left: Math.floor(width*0.3), top: Math.floor(height*0.3), width: Math.floor(width*0.4), height: Math.floor(height*0.4) })
  .stats();
const cc = crop.channels;
console.log(`Centre crop mean: R:${Math.round(cc[0].mean)} G:${Math.round(cc[1].mean)} B:${Math.round(cc[2].mean)}`);
console.log(`Hex approx: #${Math.round(cc[0].mean).toString(16).padStart(2,'0')}${Math.round(cc[1].mean).toString(16).padStart(2,'0')}${Math.round(cc[2].mean).toString(16).padStart(2,'0')}`);
