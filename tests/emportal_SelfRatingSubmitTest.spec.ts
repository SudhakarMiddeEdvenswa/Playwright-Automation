import { test, expect } from "@playwright/test";
import path from "path";
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

dotenv.config();

// EmPortal 2.0 prod: https://edvenswatech.emportal.me/ (no CAPTCHA, "Sign In").
const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";

test.describe("EmPortal 2.0 self-rating submission", () => {
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
    if (!username || !password) {
      throw new Error("USER and PASSWORD environment variables must be set.");
    }

    // 1. Login (no CAPTCHA in EmPortal 2.0).
    const loginPage = new LoginPage(page);
    await loginPage.navigate(baseURL);
    await loginPage.login(username, password);
    await loginPage.submitLogin();
    await loginPage.waitForLogin();

    // 2. Open the target self-appraisal period.
    const ratingPage = new SelfRatingPage(page);
    await ratingPage.navigateToMyRatings();
    await ratingPage.openRatingPeriod(selfRatingPeriod.periodStart);

    // 3. Guard: a submitted period is read-only and cannot be filled.
    if (await ratingPage.isReadOnly()) {
      throw new Error(
        `The period starting ${selfRatingPeriod.periodStart} is already ` +
          `submitted (read-only). Choose an open period via RATING_START_DATE.`
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
      console.log(
        `Filled section ${i + 1}/${selfRatingSections.length}: ${section.name}`
      );

      if (i < selfRatingSections.length - 1) {
        await ratingPage.clickNext();
      }
    }

    // 5. Capture proof of the completed form.
    await page.screenshot({
      path: path.join(__dirname, "self-rating-filled.png"),
      fullPage: true,
    });

    // 6. Save the draft; submit only when explicitly requested (SUBMIT_RATING=true).
    await ratingPage.saveDraft();
    console.log("Self-rating saved as draft.");

    if (submitRating) {
      await ratingPage.submit();
      await page.screenshot({
        path: path.join(__dirname, "self-rating-submitted.png"),
        fullPage: true,
      });
      console.log("Self-rating submitted.");
    } else {
      console.log(
        "SUBMIT_RATING not set - form filled & saved as draft but NOT submitted (safe mode)."
      );
    }
  });
});
