import express from "express";
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const app = express();
const port = 6000;

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

  const browser = await chromium.launch({
    args: ["--remote-debugging-port=9222"],
  });

  try {
    const results = [];

    for (const url of urls) {
      const page = await browser.newPage();

      const harFileName = generateSafeFileName(url);
      const harDirPath = path.join(`./hars`, harFileName);
      const harFilePath = path.join(harDirPath, `${harFileName}.har`);

      if (!fs.existsSync(harDirPath)) {
        fs.mkdirSync(harDirPath, { recursive: true });
      }

      // Route from the generated HAR file
      await page.routeFromHAR(harFilePath, { update: true });

      await page.goto(url, { timeout: 1200000, waitUntil: "networkidle" });

      await page.close();

      // Read the HAR file content
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
