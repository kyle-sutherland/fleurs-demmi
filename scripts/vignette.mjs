import sharp from "sharp";
import { resolve } from "path";

const base = resolve("public/Flower Photos");

async function cloneWhiteBackground(src, dest) {
  const img = sharp(`${base}/${src}`);
  const { width, height } = await img.metadata();
  const { data } = await img.clone().raw().toBuffer({ resolveWithObject: true });
  const channels = 3;
  const out = Buffer.from(data);

  // Sample the white background from the top-right corner
  // (clean white, unaffected by vignette)
  function sampleRegion(cx, cy, r) {
    let rS = 0, gS = 0, bS = 0, n = 0;
    for (let y = cy - r; y < cy + r; y++)
      for (let x = cx - r; x < cx + r; x++) {
        const idx = (y * width + x) * channels;
        rS += data[idx]; gS += data[idx+1]; bS += data[idx+2]; n++;
      }
    return [rS/n, gS/n, bS/n];
  }

  // Use top-right corner as the clean white reference
  const [bgR, bgG, bgB] = sampleRegion(Math.round(width * 0.85), Math.round(height * 0.08), 50);
  console.log(`${src}: white bg reference R:${Math.round(bgR)} G:${Math.round(bgG)} B:${Math.round(bgB)}`);

  // Also sample just inside the clean zone near the bottom-right
  // to get the local background tone right where the vignette starts
  const [localR, localG, localB] = sampleRegion(Math.round(width * 0.72), Math.round(height * 0.82), 30);
  console.log(`  local clean reference R:${Math.round(localR)} G:${Math.round(localG)} B:${Math.round(localB)}`);

  // Use whichever is brighter as the fill target
  const targetR = Math.max(bgR, localR);
  const targetG = Math.max(bgG, localG);
  const targetB = Math.max(bgB, localB);
  console.log(`  fill target R:${Math.round(targetR)} G:${Math.round(targetG)} B:${Math.round(targetB)}`);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const origR = data[idx], origG = data[idx+1], origB = data[idx+2];

      // Distance from bottom-right corner
      const dx = (width  - 1 - x) / width;
      const dy = (height - 1 - y) / height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 0.60;
      if (dist > radius) continue;

      // Is this pixel part of the white background?
      // Background pixels are bright and close in colour to the target
      const brightness = (origR + origG + origB) / 3;
      const distFromTarget = Math.sqrt(
        Math.pow(origR - targetR, 2) +
        Math.pow(origG - targetG, 2) +
        Math.pow(origB - targetB, 2)
      );

      // Pixel is "background" if it's reasonably bright and close to target white
      const isBg = brightness > 100 && distFromTarget < 120;
      if (!isBg) continue;

      // Clone stamp: how dark relative to target tells us how much correction to apply
      // At the corner (dist≈0), full correction. Fades out toward radius.
      const spatialT = Math.pow(1 - dist / radius, 0.5);

      // Pixel darkness: how far below the target it is
      const darkness = Math.max(0, (targetR - origR + targetG - origG + targetB - origB) / 3);
      const darknessT = Math.min(1, darkness / 30); // full correction if 30+ units dark

      const finalT = Math.min(1, spatialT * darknessT * 2.5);

      if (finalT > 0.01) {
        out[idx]   = Math.min(255, Math.round(origR + (targetR - origR) * finalT));
        out[idx+1] = Math.min(255, Math.round(origG + (targetG - origG) * finalT));
        out[idx+2] = Math.min(255, Math.round(origB + (targetB - origB) * finalT));
      }
    }
  }

  await sharp(out, { raw: { width, height, channels } })
    .jpeg({ quality: 95 })
    .toFile(`${base}/${dest}`);
  console.log(`  → saved ${dest}\n`);
}

await cloneWhiteBackground("MothersDay_final.jpg",     "MothersDay_clone.jpg");
await cloneWhiteBackground("Subscription_1_final.jpg", "Subscription_1_clone.jpg");
