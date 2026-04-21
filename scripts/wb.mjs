import sharp from "sharp";
import { resolve } from "path";

const base = resolve("public/Flower Photos");

async function process(src, dest) {
  await sharp(`${base}/${src}`)
    .modulate({ brightness: 1.08, saturation: 1.12 })
    .recomb([
      [1.04, 0,   0   ],
      [0,    1.0, 0   ],
      [0,    0,   0.93],
    ])
    .toFile(`${base}/${dest}`);
  const s = await sharp(`${base}/${dest}`).stats();
  const c = s.channels;
  console.log(dest, "→ R:", Math.round(c[0].mean), "G:", Math.round(c[1].mean), "B:", Math.round(c[2].mean));
}

await process("MothersDay_wb.jpg",     "MothersDay_final.jpg");
await process("Subscription_1_wb.jpg", "Subscription_1_final.jpg");
