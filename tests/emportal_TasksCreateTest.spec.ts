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
const weekEndDisplay = friday.format("DD/MM/YYYY");

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
    //    The list's date filter (defaults to the current month) constrains the
    //    search, so widen it to this week before searching for cleanup.
    await tasksPage.setWeekDateFilter(weekStartDisplay, weekEndDisplay);
    for (const task of allTasks) {
      await tasksPage.deleteTasksForWeek(task.taskName, weekStartDisplay);
    }

    // 3. Create each task. saveTask() asserts the "Add New Task" dialog closes,
    //    so a completed loop means every task was created (the tasks table
    //    paginates, so a created task may not be on the first page).
    let created = 0;
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
      created++;
      console.log(`Created task: ${task.taskName}`);
    }

    expect(created, "All tasks should have been created.").toBe(allTasks.length);
  });
});
