import express from "express";
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const app = express();
const port = 7000;

app.use(express.json());

function generateSafeFileName(url) {
  const safeName = url.replace(/(^\w+:|^)\/\//, "").replace(/\//g, "_");
  return safeName;
}

app.post("/har", async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).send("URLs must be provided as an array");
  }

  const browser = await chromium.launch();

  try {
    const results = [];

    for (const url of urls) {
      const harFileName = generateSafeFileName(url);
      const harFilePath = path.join(`./hars/${harFileName}.har`);

      const context = await browser.newContext({
        recordHar: {
          path: harFilePath,
        },
      });
      const page = await context.newPage();

      await page.goto(url, { timeout: 120000, waitUntil: "networkidle" });
      await context.close();
      const harFileContent = fs.readFileSync(harFilePath, "utf8");
      const harJson = JSON.parse(harFileContent);

      results.push({
        url: url,
        fullReport: harJson,
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
