import { test, expect, Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";
import dotenv from "dotenv";

import { LoginPage } from "./pages/LoginPage";
import { SelfRatingPage } from "./pages/SelfRatingPage";
import {
  selfRatingSections,
  selfRatingPeriod,
  submitRating,
  minWordsForStars,
  wordCount,
} from "../utils/selfRatingData";

// Load environment variables (.env) for both prod and dev runs.
dotenv.config();

const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";

// How many times to re-read the CAPTCHA if OCR misreads it and login fails.
const MAX_CAPTCHA_ATTEMPTS = 6;

/**
 * Read the CAPTCHA image with OCR and return a cleaned alphanumeric string.
 */
async function readCaptcha(page: Page): Promise<string> {
  const captchaImage = page.getByRole("img", { name: "CAPTCHA" });
  await expect(captchaImage).toBeVisible();

  const captchaPath = path.join(__dirname, "captcha.png");
  fs.writeFileSync(captchaPath, await captchaImage.screenshot());

  const result = await Tesseract.recognize(captchaPath, "eng");
  // Keep only the alphanumeric characters OCR is confident about.
  return result.data.text.replace(/[^a-zA-Z0-9]/g, "").trim();
}

/**
 * Log in, solving the CAPTCHA with OCR. Because OCR is not 100% reliable, retry
 * with a freshly generated CAPTCHA until login succeeds or attempts run out.
 */
async function loginWithCaptcha(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.navigate(baseURL);

  if (!username || !password) {
    throw new Error("USER and PASSWORD environment variables must be set.");
  }

  for (let attempt = 1; attempt <= MAX_CAPTCHA_ATTEMPTS; attempt++) {
    await loginPage.login(username, password);

    const captchaText = await readCaptcha(page);
    console.log(`CAPTCHA attempt ${attempt}: "${captchaText}"`);
    await loginPage.fillCaptcha(captchaText);
    await loginPage.submitLogin();

    // Success = the authenticated shell (Ratings nav) becomes available.
    const loggedIn = await page
      .getByRole("button", { name: "Ratings" })
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (loggedIn) {
      console.log(`Logged in successfully on attempt ${attempt}.`);
      return;
    }

    console.warn(`Login failed on attempt ${attempt}, refreshing CAPTCHA...`);
    // Refresh the CAPTCHA (reload icon sits next to the CAPTCHA image).
    await page
      .getByRole("img", { name: "CAPTCHA" })
      .locator("xpath=following-sibling::button")
      .click()
      .catch(() => undefined);
    await page.waitForTimeout(500);
  }

  throw new Error(
    `Failed to log in after ${MAX_CAPTCHA_ATTEMPTS} CAPTCHA attempts.`
  );
}

test.describe("EmPortal self-rating (PERF) submission", () => {
  // Filling 5 sections with OCR-based login retries needs a generous budget.
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.setTimeout(180_000);

  // Guard the test data itself: every comment must satisfy EmPortal's minimum
  // word count for its rating, otherwise the form cannot be submitted.
  test("Rating comments meet the minimum word count for their stars", () => {
    for (const section of selfRatingSections) {
      for (const c of section.criteria) {
        const min = minWordsForStars(c.stars);
        expect(
          wordCount(c.comment),
          `"${c.title}" (${c.stars} stars) needs >= ${min} words.`
        ).toBeGreaterThanOrEqual(min);
      }
    }
  });

  test("Fill the self-rating form for the configured period", async ({
    page,
  }) => {
    // 1. Authenticate (handles CAPTCHA with retry).
    await loginWithCaptcha(page);
    await expect(page).toHaveURL(/#\/home/);

    // 2. Open the Ratings module and the target self-appraisal period.
    const ratingPage = new SelfRatingPage(page);
    await ratingPage.navigateToRatings();
    await ratingPage.openSelfAppraisal(
      selfRatingPeriod.rowDate,
      selfRatingPeriod.year,
      selfRatingPeriod.month
    );

    // 3. Guard: a previously submitted period is read-only and cannot be filled.
    if (await ratingPage.isReadOnly()) {
      throw new Error(
        `The period starting ${selfRatingPeriod.rowDate} is already submitted ` +
          `(read-only). Choose an open period via RATING_START_DATE / RATING_MONTH.`
      );
    }

    // 4. Fill each section, advancing with Next between sections.
    for (let i = 0; i < selfRatingSections.length; i++) {
      const section = selfRatingSections[i];

      const shownName = await ratingPage.getCurrentSectionName();
      expect(
        shownName,
        `Expected section "${section.name}" but the form shows "${shownName}".`
      ).toBe(section.name);

      await ratingPage.fillCurrentSection(section);
      console.log(`Filled section ${i + 1}/${selfRatingSections.length}: ${section.name}`);

      const isLastSection = i === selfRatingSections.length - 1;
      if (!isLastSection) {
        await ratingPage.clickNext();
      }
    }

    // 5. Capture proof of the completed form before any submission decision.
    await page.screenshot({
      path: path.join(__dirname, "self-rating-filled.png"),
      fullPage: true,
    });

    // 6. Submit only when explicitly requested (SUBMIT_RATING=true). Submitting
    //    permanently records the appraisal, so by default we stop here.
    if (submitRating) {
      await ratingPage.submit();
      await page.screenshot({
        path: path.join(__dirname, "self-rating-submitted.png"),
        fullPage: true,
      });
      console.log("Self-rating submitted.");
    } else {
      console.log(
        "SUBMIT_RATING not set - form filled but NOT submitted (safe mode)."
      );
    }
  });
});
