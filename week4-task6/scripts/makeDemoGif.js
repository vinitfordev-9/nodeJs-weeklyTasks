const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const { GIFEncoder, quantize, applyPalette } = require("gifenc");
const directory = path.join(__dirname, "../docs/demo-frames");
const gif = GIFEncoder();
for (const file of fs.readdirSync(directory).filter((file) => file.endsWith(".png")).sort()) {
  const { data, width, height } = PNG.sync.read(fs.readFileSync(path.join(directory, file)));
  const palette = quantize(data, 256);
  gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay: 1800 });
}
gif.finish();
fs.writeFileSync(path.join(__dirname, "../docs/realtime-demo.gif"), gif.bytes());
console.log("Created docs/realtime-demo.gif");
