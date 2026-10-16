import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import {
  timesheetData,
  taskAData,
  taskBData,
  taskCData,
  taskDData,
  taskEData,
  taskFData,
  taskGData,
  holidayData,
} from "../utils/prodData";
import { LoginPage } from "./pages/LoginPage";
import { TasksPage } from "./pages/TasksPage";
import { TimeSheetsPage } from "./pages/TimeSheetsPage";
import { HolidaysPage } from "./pages/HolidaysPage";

// Environment configuration (.env). EmPortal 2.0 prod: https://edvenswatech.emportal.me/
const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";

// Submitting permanently records the weekly timesheet, so it is OFF by default.
// Run with SUBMIT_TIMESHEET=true to actually submit instead of just saving.
const submitTimesheet = process.env.SUBMIT_TIMESHEET === "true";

const dateFormat = "YYYY-MM-DD";
// The grid is a Mon-Fri week. Anchor tasks to the current week so they line up
// with the editable weekday columns.
const monday = dayjs().startOf("week").add(1, "day"); // startOf('week') is Sunday
const friday = monday.add(4, "day");
// Anchor to the CURRENT week so task creation and the per-week cleanup
// (weekStartDisplay, derived from `monday`) target the same week.
const taskStartDate = monday.format(dateFormat); // Monday of the current week
const taskEndDate = friday.format(dateFormat); // Friday of the current week
const userName = timesheetData.userName; // "Midde Sudhakar"

// Company holiday: the 14th of the current month by default (override with
// HOLIDAY_DATE=YYYY-MM-DD). If that day falls on a weekday inside the week under
// test, a single-day "Holiday" task is created and logged (8h) on that day, and
// the regular tasks skip that day so the day is not double-counted.
const holidayDate = process.env.HOLIDAY_DATE ?? dayjs().date(14).format(dateFormat);
const holidayDisplay = dayjs(holidayDate).format("DD/MM/YYYY");
// Weekday index within this Mon-Fri week (0=Mon .. 4=Fri); -1 if the holiday is
// not a weekday of this week.
const holidayIndex = dayjs(holidayDate).diff(monday, "day");
const holidayInWeek = holidayIndex >= 0 && holidayIndex <= 4;
const holidayHours = holidayData.time.split(":")[0]; // "8" from "8:00"

// All seven tasks for the week. The heavy task (Code Commit Push, 10h estimate)
// gets 2h/day; the rest get 1h/day -> 8h/day, 40h/week.
const allTasks = [
  taskCData,
  taskAData,
  taskBData,
  taskDData,
  taskEData,
  taskFData,
  taskGData,
];

test.describe("EmPortal 2.0 - weekly timesheet submission E2E", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  // Eight tasks (seven regular + Holiday), each with robust description entry and
  // a "Holiday Warning" to accept (every Mon-Fri task's range covers the
  // holiday), so allow extra headroom over the 7-task run.
  test.setTimeout(300_000);

  test("Create tasks, fill the weekly timesheet and save/submit", async ({
    page,
  }) => {
    if (!username || !password) {
      throw new Error("USER and PASSWORD environment variables must be set.");
    }

    console.log(`Week under test: ${taskStartDate} -> ${taskEndDate}`);

    // 1. Login (EmPortal 2.0 has no CAPTCHA).
    const loginPage = new LoginPage(page);
    await loginPage.navigate(baseURL);
    await loginPage.login(username, password);
    await loginPage.submitLogin();
    await loginPage.waitForLogin();
    expect(await loginPage.isLoggedIn(userName)).toBeTruthy();

    // 1a. If a company holiday falls on a weekday of this week, look up the
    //     festival/occasion from EmPortal's Holiday Calendar and build the
    //     Holiday task's description from it (e.g. "On occasion of Ganesh
    //     Chaturthi"). Falls back to the static description if not listed.
    let holidayDescription = holidayData.taskDescription;
    if (holidayInWeek) {
      const holidaysPage = new HolidaysPage(page);
      const festival = await holidaysPage.getHolidayName(holidayDate);
      if (festival) {
        holidayDescription = `On occasion of ${festival}`;
        console.log(
          `Holiday on ${holidayDisplay} (day ${holidayIndex}): ${festival}`
        );
      } else {
        console.log(
          `No holiday listed on ${holidayDisplay}; using default description.`
        );
      }
    }

    // 2. Create the week's tasks on the Task Management page.
    const tasksPage = new TasksPage(page);
    await tasksPage.navigateToManageTasks();

    // EmPortal rejects duplicate tasks (same name + week), which leaves the
    // "Add New Task" drawer open and fails the save. Clear this week's tasks
    // first so the flow is idempotent and safe to re-run. No-op when nothing
    // matches. (Rows with an already-submitted timesheet cannot be deleted.)
    const weekStartDisplay = monday.format("DD/MM/YYYY"); // e.g. "29/06/2026"
    const weekEndDisplay = friday.format("DD/MM/YYYY"); // e.g. "03/07/2026"

    // const weekStartDisplay = "28/09/2026"; // e.g. "29/06/2026"
    // const weekEndDisplay = "02/10/2026"; // e.g. "03/07/2026"

    // The task list defaults to a current-month date filter and its search only
    // matches rows inside that range. Widen it to this week so cleanup can find
    // tasks even when the week straddles a month boundary.
    await tasksPage.setWeekDateFilter(weekStartDisplay, weekEndDisplay);

    for (const task of allTasks) {
      const removed = await tasksPage.deleteTasksForWeek(
        task.taskName,
        weekStartDisplay
      );
      if (removed > 0) {
        console.log(
          `Removed ${removed} existing "${task.taskName}" task(s) for the week.`
        );
      }
    }
    // Also clear any existing Holiday task on the holiday day (its start date is
    // the holiday, which may differ from the week's Monday).
    if (holidayInWeek) {
      await tasksPage.deleteTasksForWeek(holidayData.taskName, holidayDisplay);
    }

    for (const task of allTasks) {
      await tasksPage.clickAddTasks();
      await tasksPage.fillTaskDetails(
        task.taskName,
        task.time,
        task.taskDescription,
        taskStartDate,
        taskEndDate,
        task.projectName,
        task.taskCategory
      );
      await tasksPage.saveTask();
      console.log(`Created task: ${task.taskName}`);
    }

    // Create the single-day Holiday task for the holiday itself. saveTask()
    // accepts EmPortal's "Holiday Warning" confirmation automatically.
    if (holidayInWeek) {
      await tasksPage.clickAddTasks();
      await tasksPage.fillTaskDetails(
        holidayData.taskName,
        holidayData.time,
        holidayDescription,
        holidayDate,
        holidayDate,
        holidayData.projectName,
        holidayData.taskCategory
      );
      await tasksPage.saveTask();
      console.log(
        `Created Holiday task for ${holidayDisplay}: "${holidayDescription}"`
      );
    }

    // 3. Open the weekly timesheet grid for the same week.
    const timeSheetsPage = new TimeSheetsPage(page);
    await timeSheetsPage.navigateToManageTimeSheets();
    await timeSheetsPage.assertTimesheetPageVisible(userName);
    await timeSheetsPage.selectWeekByDate(taskStartDate);

    const expectedTasks = allTasks.length + (holidayInWeek ? 1 : 0);
    const tasksFound = await timeSheetsPage.getTotalTasksFound();
    console.log(`Tasks found in timesheet for the week: ${tasksFound}`);
    expect(tasksFound).toBeGreaterThanOrEqual(expectedTasks);

    // 4. Fill Mon-Fri hours for every regular task row, leaving the holiday day
    //    blank so it is not double-counted with the Holiday task.
    const skipDays = holidayInWeek ? [holidayIndex] : [];
    for (const task of allTasks) {
      const hoursPerDay = task.taskName === taskCData.taskName ? "2" : "1";
      await timeSheetsPage.fillTaskRowDaily(task.taskName, hoursPerDay, skipDays);
      const total = await timeSheetsPage.getTaskRowTotal(task.taskName);
      console.log(`Filled "${task.taskName}" -> weekly total ${total}`);
    }

    // 4a. Log the holiday's full-day hours on the holiday itself. The Holiday
    //     task spans only that single day, so only that column is editable.
    if (holidayInWeek) {
      await timeSheetsPage.fillTaskRowDaily(
        holidayData.taskName,
        holidayHours,
        [],
        true // accept the "Holiday Entry" confirmation on the holiday day
      );
      const total = await timeSheetsPage.getTaskRowTotal(holidayData.taskName);
      console.log(
        `Filled "${holidayData.taskName}" (${holidayDisplay}) -> weekly total ${total}`
      );
    }

    // 5. Capture proof of the filled grid.
    await page.screenshot({
      path: path.join(__dirname, "timesheet-filled.png"),
      fullPage: true,
    });

    // 6. Save the draft (reversible). Submit only when explicitly requested.
    await timeSheetsPage.saveTimesheet();
    console.log("Timesheet saved as draft.");

    if (submitTimesheet) {
      await timeSheetsPage.submitTimesheet();
      await page.screenshot({
        path: path.join(__dirname, "timesheet-submitted.png"),
        fullPage: true,
      });
      console.log("Timesheet submitted.");
    } else {
      console.log(
        "SUBMIT_TIMESHEET not set - timesheet filled & saved but NOT submitted (safe mode)."
      );
    }
  });
});

/**
 * Cleanup helper (not run by default): remove all tasks created for the week.
 * Useful when re-running the E2E so the grid does not accumulate duplicates.
 */
export async function deleteAllTasks(tasksPage: TasksPage, page: any) {
  for (const task of allTasks) {
    await tasksPage.deleteTaskByName(task.taskName);
    await expect(page.getByText(task.taskName).first()).toBeHidden();
  }
}
