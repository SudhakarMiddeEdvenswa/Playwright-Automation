import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";
import dotenv from "dotenv";
dotenv.config();
// Import necessary modules and classes
import { getToday, getPastDate, getFutureDate } from "../utils/dateUtils";
import { testData, timesheetData } from "../utils/testData";
import { LoginPage } from "./pages/LoginPage";
// Load environment variables from .env file
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
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
  // Close the page (browser will be closed automatically by Playwright test runner)
  await page.close();
});
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
