import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
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

// EmPortal 2.0 prod: https://edvenswatech.emportal.me/
const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";
const userName = timesheetData.userName;

const dateFormat = "YYYY-MM-DD";
// WEEK_OFFSET shifts the target week (0 = current). Use a future, timesheet-free
// week to exercise create+delete without colliding with submitted/saved sheets.
const weekOffset = Number(process.env.WEEK_OFFSET || 0);
const monday = dayjs()
  .startOf("week")
  .add(1 + weekOffset * 7, "day");
const friday = monday.add(4, "day");
const taskStartDate = monday.format(dateFormat);
const taskEndDate = friday.format(dateFormat);
// Date as shown in the tasks table (used to scope cleanup to this week).
const weekStartDisplay = monday.format("DD/MM/YYYY");

const allTasks = [
  taskCData,
  taskAData,
  taskBData,
  taskDData,
  taskEData,
  taskFData,
  taskGData,
];

test.describe("EmPortal 2.0 - task deletion", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.setTimeout(540_000);

  test("Creates tasks then deletes them (self-cleaning)", async ({ page }) => {
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

    const tasksPage = new TasksPage(page);
    await tasksPage.navigateToManageTasks();

    // 2. Clean slate: EmPortal rejects duplicate tasks, so remove any existing
    //    copies of these tasks for this week before (re)creating them.
    for (const task of allTasks) {
      const removed = await tasksPage.deleteTasksForWeek(
        task.taskName,
        weekStartDisplay
      );
      if (removed) console.log(`Pre-cleaned ${removed}x "${task.taskName}"`);
    }

    // 3. Create the tasks to be deleted.
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

    // 4. Delete each task for this week and confirm it is gone.
    for (const task of allTasks) {
      const removed = await tasksPage.deleteTasksForWeek(
        task.taskName,
        weekStartDisplay
      );
      expect(removed, `Expected to delete "${task.taskName}"`).toBeGreaterThan(0);
      console.log(`Deleted task: ${task.taskName}`);
    }
    // The week should now have no rows for these tasks.
    for (const task of allTasks) {
      await expect(
        page.getByRole("row").filter({ hasText: task.taskName }).filter({
          hasText: weekStartDisplay,
        })
      ).toHaveCount(0);
    }
  });
});
