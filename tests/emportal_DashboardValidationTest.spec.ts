import { test, expect } from "@playwright/test";
import dotenv from "dotenv";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

dotenv.config();

/**
 * EmPortal 2.0 - Dashboard validation suite.
 *
 * Drives the production employee Dashboard (reached via the left-nav "Dashboard"
 * link -> /admin/employees/{id}) and validates the key elements of each tab
 * covered by .github/prompts/generate_dashboard_validation_test.prompt.md:
 *   Overview | Tasks | Ratings | Timesheets | Worked Hours | Profile
 * plus the dashboard's responsiveness across screen sizes. Coverage focuses on
 * the structural and summary elements of each tab; some prompt items that would
 * mutate production data (e.g. resuming a project) are validated by presence
 * only, not by performing the action.
 *
 * Credentials and the base URL come from the .env file (production by default).
 * Validations target stable structural elements (headings, stat labels, table
 * columns, chart legends) and use flexible matchers for live counts, so the
 * suite stays green as production data changes. All interactions are
 * non-destructive (the Add External Project flow is cancelled, not saved).
 */

const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";

test.describe("EmPortal 2.0 - Dashboard validation", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.setTimeout(180_000);

  let loginPage: LoginPage;
  let dashboard: DashboardPage;

  // Log in and land on the Dashboard before each validation test (every test
  // runs against a fresh, authenticated session).
  test.beforeEach(async ({ page }) => {
    if (!username || !password) {
      throw new Error("USER and PASSWORD environment variables must be set.");
    }

    loginPage = new LoginPage(page);
    await loginPage.navigate(baseURL);
    await loginPage.login(username, password);
    await loginPage.submitLogin();
    await loginPage.waitForLogin();

    dashboard = new DashboardPage(page);
    await dashboard.navigateToDashboard();
  });

  test("Overview tab: task counts and distribution charts", async () => {
    await dashboard.selectTab("Overview");
    await dashboard.validateOverview();
  });

  test("Tasks tab: Allocated vs Worked chart and filtering", async () => {
    await dashboard.selectTab("Tasks");
    await dashboard.validateTasks();
  });

  test("Ratings tab: summary, table, status filter, search & export", async () => {
    await dashboard.selectTab("Ratings");
    await dashboard.validateRatings();
  });

  test("Timesheets tab: stats, charts, daily/weekly & project table", async () => {
    await dashboard.selectTab("Timesheets");
    await dashboard.validateTimesheets();
  });

  test("Worked Hours tab: stats, status filters, search, sort & export", async () => {
    await dashboard.selectTab("Worked Hours");
    await dashboard.validateWorkedHours();
  });

  test("Profile tab: User Info, Employee Time & Projects", async ({ page }, testInfo) => {
    await dashboard.selectTab("Profile");
    await dashboard.validateProfileUserInfo(username);
    await dashboard.validateProfileEmployeeTime();
    await dashboard.validateProfileProjects();

    // Capture proof of the validated Profile/Projects view. testInfo.outputPath
    // gives a per-test, per-project path so parallel browsers never collide.
    await page.screenshot({
      path: testInfo.outputPath("dashboard-profile-projects.png"),
      fullPage: true,
    });
  });

  test("Dashboard layout is responsive across screen sizes", async ({ page }, testInfo) => {
    const sizes = [
      { name: "desktop", width: 1920, height: 1080 },
      { name: "laptop", width: 1366, height: 768 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 390, height: 844 },
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(800);
      // The tab strip must remain reachable/usable at every breakpoint.
      await expect(
        page.getByRole("tab", { name: "Overview" }),
        `Overview tab should stay visible on ${size.name}`
      ).toBeVisible();
      // Per-project artifact path avoids cross-browser screenshot overwrites.
      await page.screenshot({
        path: testInfo.outputPath(`dashboard-${size.name}.png`),
        fullPage: false,
      });
    }
  });
});
