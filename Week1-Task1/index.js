const fs = require("fs").promises;
const path = require("path");
const summary = {};

async function scanFolder(folderPath) {
  const items = await fs.readdir(folderPath);
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const stats = await fs.stat(fullPath);

    if (stats.isFile()) {
      const extension = await path.extname(fullPath);
      if (!summary[extension]) {
        summary[extension] = {
          count: 0,
          size: 0,
        };
      }
      summary[extension].count++;
      summary[extension].size += stats.size;
    }
    if (stats.isDirectory()) {
      console.log("Folder:", fullPath);
      await scanFolder(fullPath);
    }
  }
}
async function main() {
  await scanFolder("./testFolder");
  console.log(summary);
}
main();
