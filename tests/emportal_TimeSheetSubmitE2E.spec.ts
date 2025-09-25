import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";
import dotenv from "dotenv";
dotenv.config();
// Import necessary modules and classes
import { generateFakeUser } from "../utils/fakeUser";
import { getToday, getPastDate, getFutureDate } from "../utils/dateUtils";
import {
  testData,
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
// Load environment variables from .env file
// Define base URL, username, and password from environment variables
const baseURL = process.env.BASE_URL ?? "";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";
// Define date formats for the test
const dateFormat = "YYYY-MM-DD"; // Format for <input type="date">
const todayDate = dayjs().format(dateFormat); // Format for <input type="date">
const futureDate = dayjs().add(4, "day").format(dateFormat); // Format for <input type="date">
const userName = timesheetData.userName; // User name for timesheet verification

test("Maximize window simulation", async ({ browser }) => {
  await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
});
test("Emportal Login test", async ({ page }) => {
  //const taskStartDate = "2025-06-16"; // getPastDate(4);// Use a fixed date for testing
  const today = getToday();
  //const taskEndDate = "2025-06-20"; // getToday(); // Use a fixed date for testing

  // Get a future date for task start and end
  const taskStartDate = getPastDate(4); // Get a future date for task start
  const taskEndDate = getToday(); // Get a future date for task end
  console.log("Today's Date:", today);
  console.log("Week's start Date:", taskStartDate);
  console.log("Week's end Date:", taskEndDate);
  const loginPage = new LoginPage(page);

  // Log the task details
  // Navigate to the login page
  await loginPage.navigate(baseURL);
  // Fill in username and password
  if (!username || !password) {
    throw new Error("USERNAME and PASSWORD environment variables must be set.");
  }
  await loginPage.login(username, password);

  // Locate CAPTCHA image and save it
  const captchaImage = page.getByRole("img", { name: "CAPTCHA" });
  const captchaBuffer = await captchaImage.screenshot();

  const captchaPath = path.join(__dirname, "captcha.png");
  fs.writeFileSync(captchaPath, captchaBuffer);

  // Use Tesseract.js to extract text from the image
  const result = await Tesseract.recognize(captchaPath, "eng");
  const captchaText = result.data.text.trim();

  console.log("CAPTCHA Text:", captchaText);

  // Fill in the CAPTCHA field
  await loginPage.fillCaptcha(captchaText);
  // Submit the form
  await loginPage.submitLogin();
  // Verify successful login
  await expect(page).toHaveURL(baseURL + "#/home");
  // Verify the user is logged in by checking the greeting message
  // Get the greeting based on the time of day
  const greetingFromTime = await getGreeting();
  console.log(`Greeting based on time: ${greetingFromTime}`);
  //wait for the page to load and display the user's name
  await page.waitForSelector(`text=${greetingFromTime}, ${userName}`, {
    timeout: 10000, // Wait up to 10 seconds for the text to appear
  });
  // Verify the user is logged in
  await expect(
    page.getByText(`${greetingFromTime}, ${userName}`)
  ).toBeVisible();
  // Navigate to Manage Tasks
  // Create an instance of TasksPage
  const tasksPage = new TasksPage(page);
  // Navigate to Manage Tasks & Verify the Manage Tasks page is visible
  await tasksPage.navigateToManageTasks();
  // Add task details
  // Click the Add Tasks button
  await tasksPage.clickAddTasks();
  // Fill in task details
  await tasksPage.fillTaskDetails(
    taskCData.taskName,
    taskCData.time,
    taskCData.taskDescription,
    taskStartDate,
    taskEndDate,
    taskCData.projectName,
    taskCData.taskCategory
  );
  // Save the task
  await tasksPage.saveTask();
  // Click the Add Tasks button
  await tasksPage.clickAddTasks();
  // Fill in task details
  await tasksPage.fillTaskDetails(
    taskAData.taskName,
    taskAData.time,
    taskAData.taskDescription,
    taskStartDate,
    taskEndDate,
    taskAData.projectName,
    taskAData.taskCategory
  );
  // Save the task
  await tasksPage.saveTask();
  // Add another task
  // Click the Add Tasks button
  await tasksPage.clickAddTasks();
  // Fill in task details
  await tasksPage.fillTaskDetails(
    taskBData.taskName,
    taskBData.time,
    taskBData.taskDescription,
    taskStartDate,
    taskEndDate,
    taskBData.projectName,
    taskBData.taskCategory
  );
  // Save the task
  await tasksPage.saveTask();
  // Add another task
  // Click the Add Tasks button
  await tasksPage.clickAddTasks();
  // Fill in task details
  await tasksPage.fillTaskDetails(
    taskDData.taskName,
    taskDData.time,
    taskDData.taskDescription,
    taskStartDate,
    taskEndDate,
    taskDData.projectName,
    taskDData.taskCategory
  );
  // Save the task
  await tasksPage.saveTask();
  // Add another task
  // Click the Add Tasks button
  await tasksPage.clickAddTasks();
  // Fill in task details
  await tasksPage.fillTaskDetails(
    taskEData.taskName,
    taskEData.time,
    taskEData.taskDescription,
    taskStartDate,
    taskEndDate,
    taskEData.projectName,
    taskEData.taskCategory
  );
  // Save the task
  await tasksPage.saveTask();
  // Add another task
  // Click the Add Tasks button
  await tasksPage.clickAddTasks();
  // Fill in task details
  await tasksPage.fillTaskDetails(
    taskFData.taskName,
    taskFData.time,
    taskFData.taskDescription,
    taskStartDate,
    taskEndDate,
    taskFData.projectName,
    taskFData.taskCategory
  );
  // Save the task
  await tasksPage.saveTask();
  // Add another task
  // Click the Add Tasks button
  await tasksPage.clickAddTasks();
  // Fill in task details
  await tasksPage.fillTaskDetails(
    taskGData.taskName,
    taskGData.time,
    taskGData.taskDescription,
    taskStartDate,
    taskEndDate,
    taskGData.projectName,
    taskGData.taskCategory
  );
  // Save the task
  await tasksPage.saveTask();
  // Navigate to Manage Time sheets
  const timeSheetsPage = new TimeSheetsPage(page);
  // Navigate to Manage Time sheets
  await timeSheetsPage.navigateToManageTimeSheets();
  // Assert that the tasks page is visible
  await timeSheetsPage.assertTasksPageVisible();
  // Assert that the timesheet page is visible by checking the user name
  await timeSheetsPage.assertTimesheetPageVisible(userName);
  //fill in time for the first task
  for (let i = 0; i < 5; i++) {
    //wait for the element to be visible before filling
    page.setDefaultTimeout(30000);
    await page
      .getByLabel("hh:mm")
      .nth(i)
      .waitFor({ state: "visible", timeout: 20000 });
    // Fill in 2 hours for the first 5 tasks
    console.log(`Filling time for task ${i + 1}`);
    // Fill in 2 hours for the first 5 tasks
    await page.getByLabel("hh:mm").nth(i).fill("2", { timeout: 30000 });
    await page.getByLabel("hh:mm").nth(i).press("Tab");
    //assert that the time is filled correctly
    if (!expect(page.getByLabel("hh:mm").nth(i)).toHaveValue("02:00")) {
      await page.getByLabel("hh:mm").nth(i).fill("2", { timeout: 60000 });
      await page.getByLabel("hh:mm").nth(i).focus();
      await page.getByLabel("hh:mm").nth(i).press("Tab");
      await expect(page.getByLabel("hh:mm").nth(i)).toHaveValue("02:00");
    }
    //await expect(page.getByLabel("hh:mm").nth(i)).toHaveValue("02:00");
    console.log(`Task ${i + 1} time filled correctly`);
    // Wait for the next element to be visible before filling
    await page
      .getByLabel("hh:mm")
      .nth(i + 1)
      .waitFor({ state: "visible", timeout: 5000 });
    page.setDefaultTimeout(5000); // Set default timeout to 5 seconds
  }
  const items = page.getByLabel("hh:mm"); // Get all elements with the label "hh:mm"
  // Get the count of matching elements
  const count = await items.count();
  console.log(`Total items found: ${count}`);
  // Fill in time for the second task onwards from the 5th element
  for (let i = 5; i < count; i++) {
    // Fill in 1 hour for each of the remaining tasks
    //wait for the element to be visible before filling
    page.setDefaultTimeout(30000);
    await page
      .getByLabel("hh:mm")
      .nth(i)
      .waitFor({ state: "visible", timeout: 20000 });
    // Fill in 1 hour for the remaining tasks
    console.log(`Filling time for task ${i + 1}`);
    // Fill in 1 hour for the remaining tasks
    await page.getByLabel("hh:mm").nth(i).fill("1", { timeout: 60000 });
    await page.getByLabel("hh:mm").nth(i).focus();
    await page.getByLabel("hh:mm").nth(i).press("Tab");
    //assert that the time is filled correctly
    if (!expect(page.getByLabel("hh:mm").nth(i)).toHaveValue("01:00")) {
      await page.getByLabel("hh:mm").nth(i).fill("1", { timeout: 60000 });
      await page.getByLabel("hh:mm").nth(i).focus();
      await page.getByLabel("hh:mm").nth(i).press("Tab");
      await expect(page.getByLabel("hh:mm").nth(i)).toHaveValue("01:00");
    }
    console.log(`Task ${i + 1} time filled correctly`);
    page.setDefaultTimeout(5000); // Set default timeout to 5 seconds
    // Fill in 1 hour for the next task
  }
  // Save the timesheet
  await timeSheetsPage.saveTimesheet();
  // Confirm the timesheet submission
  await timeSheetsPage.confirmTimesheetSubmission();
  // Verify timesheet submission
  // const isSubmitted = await timeSheetsPage.verifyTimesheetSubmission();
  // expect(isSubmitted).toBeTruthy();

  // Close the page (browser will be closed automatically by Playwright test runner)
  await page.close();
});

// create a function to delete all tasks
async function deleteAllTasks(tasksPage: TasksPage, page: any) {
  // Delete the second task
  await tasksPage.deleteTaskByName(taskBData.taskName);
  // Verify all tasks are deleted
  await expect(page.getByText(taskBData.taskName)).not.toBeVisible();
  // Delete the third task
  await tasksPage.deleteTaskByName(taskCData.taskName);
  // Verify the task is deleted
  await expect(page.getByText(taskCData.taskName)).not.toBeVisible();
  // Delete the fourth task
  await tasksPage.deleteTaskByName(taskDData.taskName);
  // Verify the task is deleted
  await expect(page.getByText(taskDData.taskName)).not.toBeVisible();
  // Delete the fifth task
  await tasksPage.deleteTaskByName(taskEData.taskName);
  // Verify the task is deleted
  await expect(page.getByText(taskEData.taskName)).not.toBeVisible();
  // Delete the sixth task
  await tasksPage.deleteTaskByName(taskFData.taskName);
  // Verify the task is deleted
  await expect(page.getByText(taskFData.taskName)).not.toBeVisible();
  // Delete the seventh task
  await tasksPage.deleteTaskByName(taskGData.taskName);
  // Verify the task is deleted
  await expect(page.getByText(taskGData.taskName)).not.toBeVisible();
}
// return greeting
async function getGreeting() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  // Determine the greeting based on the current time
  let greeting = "";
  // Set greeting based on the time of day
  if (hours >= 0 && hours < 12) {
    greeting = testData.greetingTimes.morning; // "Good Morning"
  } else if (hours >= 12 && (hours < 16 || (hours === 15 && minutes <= 59))) {
    greeting = testData.greetingTimes.afternoon; // "Good Afternoon"
  } else if ((hours >= 16 && hours <= 23) || (hours === 0 && minutes === 0)) {
    greeting = testData.greetingTimes.evening; // "Good Evening"
  } else {
    greeting = "Hello";
  }
  return greeting;
}
