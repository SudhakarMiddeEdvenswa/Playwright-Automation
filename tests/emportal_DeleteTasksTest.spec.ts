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
const monday = dayjs().startOf("week").add(1, "day");
const friday = monday.add(4, "day");
const taskStartDate = monday.format(dateFormat);
const taskEndDate = friday.format(dateFormat);

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
  test.setTimeout(150_000);

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

    // 2. Create the tasks to be deleted.
    const tasksPage = new TasksPage(page);
    await tasksPage.navigateToManageTasks();
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

    // 3. Delete each task and confirm it disappears from the table.
    for (const task of allTasks) {
      await tasksPage.deleteTaskByName(task.taskName);
      await expect(
        page.getByText(task.taskName, { exact: true })
      ).toHaveCount(0);
      console.log(`Deleted task: ${task.taskName}`);
    }
  });
});
