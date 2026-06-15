import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object for the EmPortal 2.0 "Timesheets" page (/admin/timesheets).
 *
 * The timesheet is now a WEEKLY GRID (table "timesheet table"):
 *   columns = Project | Task Name | Estimated Time | MON..SUN (per date) | Total
 *   each weekday cell is a MUI time field rendered as a `group "hh:mm"` with
 *   separate "Hours" and "Minutes" spinbuttons. Mon-Fri are editable; Sat/Sun
 *   and the Total column are disabled.
 *
 * Reached via the left-nav "Project Execution" fly-out -> "Timesheet" (the old
 * "Manage Timesheets Manage" button is gone). Saving/submitting is done with the
 * "Save" and "Submit" buttons at the bottom of the grid.
 */
export class TimeSheetsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Open the Timesheets page via the "Project Execution" fly-out menu. */
  async navigateToManageTimeSheets() {
    await this.page
      .getByRole("button", { name: "Project Execution" })
      .hover();
    await this.page
      .getByRole("link", { name: "Timesheet", exact: true })
      .click();
    await expect(
      this.page.getByRole("heading", { name: "Timesheets", exact: true })
    ).toBeVisible();
  }

  /** Assert the timesheet belongs to the expected user. */
  async assertTimesheetPageVisible(userName: string) {
    await expect(
      this.page.getByText(`Timesheet for ${userName}`)
    ).toBeVisible();
  }

  /**
   * Point the week selector at the week containing the given ISO date
   * ("YYYY-MM-DD"). The grid reloads to show that Mon-Sun week.
   */
  async selectWeekByDate(isoDate: string) {
    const [year, month, day] = isoDate.split("-");
    const group = this.page.getByRole("group", { name: "Select Week" });
    await group.getByRole("spinbutton", { name: "Day" }).fill(day);
    await group.getByRole("spinbutton", { name: "Month" }).fill(month);
    await group.getByRole("spinbutton", { name: "Year" }).fill(year);
    // Allow the grid to refresh for the selected week.
    await this.page.waitForTimeout(1000);
  }

  /** Number of task rows found for the selected week (from the summary banner). */
  async getTotalTasksFound(): Promise<number> {
    const value = await this.page
      .locator("xpath=//*[normalize-space()='Total Tasks Found:']/following-sibling::*[1]")
      .first()
      .textContent();
    return Number((value ?? "0").trim());
  }

  /** Locate a task row in the grid by its (unique) task name text. */
  private taskRow(taskName: string): Locator {
    return this.page
      .getByRole("row")
      .filter({ has: this.page.getByText(taskName, { exact: true }) })
      .first();
  }

  /**
   * Fill the same number of hours into every editable weekday (Mon-Fri) of a
   * task row. `hours` is the hour value, e.g. "2" -> 02:00, "1" -> 01:00.
   */
  async fillTaskRowDaily(taskName: string, hours: string) {
    const row = this.taskRow(taskName);
    await expect(row, `Task row "${taskName}" not found in the grid.`).toBeVisible();

    const hourFields = row.getByRole("spinbutton", { name: "Hours" });
    // Order is MON..SUN; only the first five (weekdays) are editable.
    for (let day = 0; day < 5; day++) {
      const field = hourFields.nth(day);
      await field.fill(hours.padStart(2, "0"));
    }
    // Commit the last edited cell.
    await this.page.keyboard.press("Tab");
  }

  /** Read a task row's weekly Total cell (e.g. "10:00"). */
  async getTaskRowTotal(taskName: string): Promise<string> {
    const row = this.taskRow(taskName);
    const lastCell = row.getByRole("cell").last();
    return ((await lastCell.textContent()) ?? "").trim();
  }

  /** Save the timesheet as a draft. */
  async saveTimesheet() {
    await this.page.getByRole("button", { name: "Save", exact: true }).click();
  }

  /**
   * Submit the timesheet. Submitting is a final action, so call this only when
   * submission is explicitly intended. Handles an optional confirmation dialog.
   */
  async submitTimesheet() {
    await this.page
      .getByRole("button", { name: "Submit", exact: true })
      .click();

    // Some flows raise a confirmation dialog; confirm it if present.
    const confirm = this.page.getByRole("button", {
      name: /^(Confirm|Yes|Submit)$/,
    });
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
  }

  /** Verify the success toast/message after submission. */
  async verifyTimesheetSubmission(): Promise<boolean> {
    return await this.page
      .getByText(/submitted successfully/i)
      .isVisible()
      .catch(() => false);
  }
}
