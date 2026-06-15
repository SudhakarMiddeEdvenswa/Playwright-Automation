import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

import { timesheetData } from "../utils/prodData";
import { LoginPage } from "./pages/LoginPage";

// EmPortal 2.0 prod: https://edvenswatech.emportal.me/ (no CAPTCHA, "Sign In").
const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";
const userName = timesheetData.userName; // "Midde Sudhakar"

test.describe("EmPortal 2.0 - login", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("Logs in successfully without CAPTCHA", async ({ page }) => {
    if (!username || !password) {
      throw new Error("USER and PASSWORD environment variables must be set.");
    }

    const loginPage = new LoginPage(page);
    await loginPage.navigate(baseURL);
    await loginPage.login(username, password);
    await loginPage.submitLogin();

    // Success = authenticated /admin shell with the user's name in the menu.
    await loginPage.waitForLogin();
    await expect(page).toHaveURL(/\/admin\//);
    expect(await loginPage.isLoggedIn(userName)).toBeTruthy();
  });
});
