import sharp from "sharp";
import { resolve } from "path";

const base = resolve("public/Flower Photos");

// Service photo reference (warm-neutral target):
//   Wedding Flowers 3.jpg  → R:175 G:155 B:147  (warm)
//   sympathy.jpeg          → R:185 G:184 B:184  (neutral)
//   Average target ratio   → R:1.000 G:0.944 B:0.921
//
// SubscriptionEdit current → R:188 G:181 B:168  ratio G:0.963 B:0.894
// MothersDayEdit current   → R:192 G:180 B:162  ratio G:0.9375 B:0.844

async function process(src, dest, brightness, recombMatrix) {
  await sharp(`${base}/${src}`)
    .modulate({ brightness })
    .recomb(recombMatrix)
    .jpeg({ quality: 95 })
    .toFile(`${base}/${dest}`);

  const s = await sharp(`${base}/${dest}`).stats();
  const c = s.channels;
  console.log(`${dest} → R:${Math.round(c[0].mean)} G:${Math.round(c[1].mean)} B:${Math.round(c[2].mean)}`);
}

// SubscriptionEdit: G slightly down, B slightly up to match target ratios
await process(
  "SubscriptionEdit.jpg",
  "SubscriptionWB.jpg",
  1.00,
  [
    [1.00,  0,    0   ],
    [0,     0.978, 0  ],
    [0,     0,    1.04],
  ]
);

// MothersDayEdit: pull R down, nudge G up slightly, push B up notably
await process(
  "MothersDayEdit.jpg",
  "MothersDayWB.jpg",
  0.98,
  [
    [0.965, 0,    0   ],
    [0,     1.01, 0   ],
    [0,     0,    1.10],
  ]
);
