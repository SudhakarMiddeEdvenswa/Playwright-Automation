import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import dotenv from "dotenv";
dotenv.config();

import { timesheetData, holidayData } from "../utils/prodData";
import { LoginPage } from "./pages/LoginPage";
import { TasksPage } from "./pages/TasksPage";
import { HolidaysPage } from "./pages/HolidaysPage";

// EmPortal 2.0 prod: https://edvenswatech.emportal.me/
const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";
const userName = timesheetData.userName;

const dateFormat = "YYYY-MM-DD";
// The company holiday is on the 14th of the current month (a single day).
// Override with HOLIDAY_DATE=YYYY-MM-DD to target a different holiday date.
const holidayDate =
  process.env.HOLIDAY_DATE ?? dayjs().date(14).format(dateFormat);
const holidayDisplay = dayjs(holidayDate).format("DD/MM/YYYY");

test.describe("EmPortal 2.0 - holiday task creation", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.setTimeout(120_000);

  test("Creates a Holiday task with a description from the Holiday Calendar", async ({
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
    expect(await loginPage.isLoggedIn(userName)).toBeTruthy();

    // 2. Read the festival/occasion for the holiday date from EmPortal's Holiday
    //    Calendar and build the task description from it (e.g. Ganesh Chaturthi).
    const holidaysPage = new HolidaysPage(page);
    const festival = await holidaysPage.getHolidayName(holidayDate);
    expect(
      festival,
      `${holidayDisplay} should be a listed holiday in the Holiday Calendar`
    ).toBeTruthy();
    const description = `On occasion of ${festival}`;
    console.log(`Holiday on ${holidayDisplay}: ${festival} -> "${description}"`);

    // 3. Create the single-day Holiday task on the Task Management page.
    const tasksPage = new TasksPage(page);
    await tasksPage.navigateToManageTasks();

    // Idempotent: EmPortal rejects duplicate tasks, so clear any existing
    // Holiday task for this day first (widen the list filter to the day so the
    // search can find it). No-op when nothing matches.
    await tasksPage.setWeekDateFilter(holidayDisplay, holidayDisplay);
    await tasksPage.deleteTasksForWeek(holidayData.taskName, holidayDisplay);

    await tasksPage.clickAddTasks();
    await tasksPage.fillTaskDetails(
      holidayData.taskName,
      holidayData.time,
      description,
      holidayDate, // start date = the holiday
      holidayDate, // end date   = the holiday (single day)
      holidayData.projectName,
      holidayData.taskCategory
    );
    await tasksPage.saveTask();
    console.log(`Created Holiday task for ${holidayDisplay}: "${description}"`);
  });
});
