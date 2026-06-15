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
// Anchor tasks to the current Mon-Fri week (matches the weekly timesheet grid).
const weekOffset = Number(process.env.WEEK_OFFSET || 0);
const monday = dayjs()
  .startOf("week")
  .add(1 + weekOffset * 7, "day");
const friday = monday.add(4, "day");
const taskStartDate = monday.format(dateFormat);
const taskEndDate = friday.format(dateFormat);
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

test.describe("EmPortal 2.0 - task creation", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.setTimeout(120_000);

  test("Creates the week's tasks via the Add New Task dialog", async ({
    page,
  }) => {
    if (!username || !password) {
      throw new Error("USER and PASSWORD environment variables must be set.");
    }
    console.log(`Creating tasks for week: ${taskStartDate} -> ${taskEndDate}`);

    // 1. Login (no CAPTCHA in EmPortal 2.0).
    const loginPage = new LoginPage(page);
    await loginPage.navigate(baseURL);
    await loginPage.login(username, password);
    await loginPage.submitLogin();
    await loginPage.waitForLogin();
    expect(await loginPage.isLoggedIn(userName)).toBeTruthy();

    const tasksPage = new TasksPage(page);
    await tasksPage.navigateToManageTasks();

    // 2. Clean slate: EmPortal rejects duplicate tasks, so clear any existing
    //    copies of these tasks for this week first (keeps the spec re-runnable).
    for (const task of allTasks) {
      await tasksPage.deleteTasksForWeek(task.taskName, weekStartDisplay);
    }

    // 3. Create each task.
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

    // 3. Verify the tasks now appear in the table.
    for (const task of allTasks) {
      await expect(
        page.getByText(task.taskName, { exact: true }).first()
      ).toBeVisible();
    }
  });
});
