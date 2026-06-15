import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { timesheetData } from "../utils/prodData";
import { LoginPage } from "./pages/LoginPage";
import { TimeSheetsPage } from "./pages/TimeSheetsPage";

// EmPortal 2.0 prod: https://edvenswatech.emportal.me/
const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";
const userName = timesheetData.userName;

// Submitting permanently records the timesheet -> OFF by default.
const submitTimesheet = process.env.SUBMIT_TIMESHEET === "true";

const dateFormat = "YYYY-MM-DD";
const weekDate = dayjs().startOf("week").add(1, "day").format(dateFormat); // Monday

test.describe("EmPortal 2.0 - timesheet filling", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.setTimeout(120_000);

  test("Fills the weekly timesheet grid and saves", async ({ page }) => {
    if (!username || !password) {
      throw new Error("USER and PASSWORD environment variables must be set.");
    }

    // 1. Login.
    const loginPage = new LoginPage(page);
    await loginPage.navigate(baseURL);
    await loginPage.login(username, password);
    await loginPage.submitLogin();
    await loginPage.waitForLogin();
    expect(await loginPage.isLoggedIn(userName)).toBeTruthy();

    // 2. Open the timesheet for the current week.
    const timeSheetsPage = new TimeSheetsPage(page);
    await timeSheetsPage.navigateToManageTimeSheets();
    await timeSheetsPage.assertTimesheetPageVisible(userName);
    await timeSheetsPage.selectWeekByDate(weekDate);

    const tasksFound = await timeSheetsPage.getTotalTasksFound();
    console.log(`Tasks found for the week: ${tasksFound}`);
    expect(
      tasksFound,
      "No tasks found for this week - create tasks first (TasksCreate spec)."
    ).toBeGreaterThan(0);

    // 3. Fill 1h into every editable weekday cell.
    const filled = await timeSheetsPage.fillAllWeekdayHours("1");
    console.log(`Filled ${filled} weekday cells with 01:00.`);
    expect(filled).toBeGreaterThan(0);

    await page.screenshot({
      path: path.join(__dirname, "timesheet-filling.png"),
      fullPage: true,
    });

    // 4. Save the draft; submit only when explicitly requested.
    await timeSheetsPage.saveTimesheet();
    console.log("Timesheet saved as draft.");

    if (submitTimesheet) {
      await timeSheetsPage.submitTimesheet();
      console.log("Timesheet submitted.");
    } else {
      console.log(
        "SUBMIT_TIMESHEET not set - filled & saved but NOT submitted (safe mode)."
      );
    }
  });
});
