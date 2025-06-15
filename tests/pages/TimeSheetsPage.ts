import { Page } from "@playwright/test";
export class TimeSheetsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }
  // Navigate to Manage Time sheets
  async navigateToManageTimeSheets() {
    await this.page
      .getByRole("button", { name: "Manage Timesheets Manage" })
      .click();
  }
  // Assert that tasks page is visible
  async assertTasksPageVisible() {
    await this.page
      .locator("div")
      .filter({ hasText: /^Tasks$/ })
      .nth(2)
      .isVisible();
  }
  // Assert that the timesheet page is visible by checking the user name
  async assertTimesheetPageVisible(userName: string) {
    await this.page.getByText(`Timesheet for ${userName}`).isVisible();
  }
  // Fill in time for the first task
  async fillTimeForFirstTask(hours: string[]) {
    for (let i = 0; i < hours.length; i++) {
      await this.page.getByLabel("hh:mm").nth(i).click();
      await this.page.getByLabel("hh:mm").nth(i).fill(hours[i]);
    }
  }

  // Fill in time for the second task
  async fillTimeForSecondTask(startIndex: number, hours: string[]) {
    const items = this.page.getByLabel("hh:mm"); // Get all elements with the label "hh:mm"
    const count = await items.count();
    console.log(`Total items found: ${count}`);
    for (let i = startIndex; i < count; i++) {
      await this.page.getByLabel("hh:mm").nth(i).click();
      await this.page.getByLabel("hh:mm").nth(i).fill(hours[i]);
    }
  }
  // Save the timesheet
  async saveTimesheet() {
    await this.page.getByRole("button", { name: "Save" }).isVisible();
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  // Confirm the timesheet submission
  async confirmTimesheetSubmission() {
    await this.page.getByRole("button", { name: "Submit" }).isVisible();
    await this.page.getByRole("button", { name: "Submit" }).click();
    await this.page.getByRole("button", { name: "Confirm" }).click();
  }
  // Verify timesheet submission
  async verifyTimesheetSubmission() {
    return await this.page
      .getByText("Timesheet submitted successfully")
      .isVisible();
  }
}
