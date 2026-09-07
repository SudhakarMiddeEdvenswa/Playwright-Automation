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
} from "../utils/prodData";
import { LoginPage } from "./pages/LoginPage";
import { TasksPage } from "./pages/TasksPage";
import { TimeSheetsPage } from "./pages/TimeSheetsPage";

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
const taskStartDate = monday.format(dateFormat);// Monday, 17 August 2026
const taskEndDate = friday.format(dateFormat);// Friday, 21 August 2026
const userName = timesheetData.userName; // "Midde Sudhakar"

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
  test.setTimeout(180_000);

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

    // 2. Create the week's tasks on the Task Management page.
    const tasksPage = new TasksPage(page);
    await tasksPage.navigateToManageTasks();

    // EmPortal rejects duplicate tasks (same name + week), which leaves the
    // "Add New Task" drawer open and fails the save. Clear this week's tasks
    // first so the flow is idempotent and safe to re-run. No-op when nothing
    // matches. (Rows with an already-submitted timesheet cannot be deleted.)
    const weekStartDisplay = monday.format("DD/MM/YYYY"); // e.g. "29/06/2026"
    const weekEndDisplay = friday.format("DD/MM/YYYY"); // e.g. "03/07/2026"

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

    // 3. Open the weekly timesheet grid for the same week.
    const timeSheetsPage = new TimeSheetsPage(page);
    await timeSheetsPage.navigateToManageTimeSheets();
    await timeSheetsPage.assertTimesheetPageVisible(userName);
    await timeSheetsPage.selectWeekByDate(taskStartDate);

    const tasksFound = await timeSheetsPage.getTotalTasksFound();
    console.log(`Tasks found in timesheet for the week: ${tasksFound}`);
    expect(tasksFound).toBeGreaterThanOrEqual(allTasks.length);

    // 4. Fill Mon-Fri hours for every task row.
    for (const task of allTasks) {
      const hoursPerDay = task.taskName === taskCData.taskName ? "2" : "1";
      await timeSheetsPage.fillTaskRowDaily(task.taskName, hoursPerDay);
      const total = await timeSheetsPage.getTaskRowTotal(task.taskName);
      console.log(`Filled "${task.taskName}" -> weekly total ${total}`);
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
