import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object for the EmPortal 2.0 "Timesheets" page (/admin/timesheets).
 *
 * The timesheet is now a WEEKLY GRID (table "timesheet table"):
 *   columns = Project | Task Name | Estimated Time | MON..SUN (per date) | Total
 *   each weekday cell is a MUI time field rendered as a `group "hh:mm"` with
 *   separate "Hours" and "Minutes" spinbuttons. A weekday cell is editable only
 *   when the task's own date range covers that day; days the task does not span
 *   (and Sat/Sun and the Total column) render disabled.
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

  /**
   * Locate a task row in the grid by its task-name cell. Matching the name
   * *cell* (and excluding time-input cells) is important: when a weekday is a
   * company holiday, every row's holiday cell carries a "Holiday" label, so a
   * plain getByText("Holiday") would match every row. The task-name cell holds
   * the name text and no time spinbuttons, so require exact name text in a cell
   * that has no spinbutton - which the day-cell holiday badge always does.
   */
  private taskRow(taskName: string): Locator {
    return this.page
      .getByRole("row")
      .filter({
        has: this.page
          .getByRole("cell")
          .filter({ has: this.page.getByText(taskName, { exact: true }) })
          .filter({ hasNot: this.page.getByRole("spinbutton") }),
      })
      .first();
  }

  /**
   * Fill the same number of hours into every editable weekday (Mon-Fri) of a
   * task row. `hours` is the hour value, e.g. "2" -> 02:00, "1" -> 01:00.
   *
   * A weekday cell is only editable when the task's date range covers that day,
   * so disabled cells are skipped. The MUI Hours section is filled by focusing
   * and typing (a plain fill() can drop digits on these fields), with fill() as
   * a fallback.
   *
   * @param skipDays weekday indices (0=Mon .. 4=Fri) to leave blank, e.g. a
   *   company holiday that should carry only the Holiday task's hours, not this
   *   task's regular work.
   * @param confirmHoliday when true, accept EmPortal's "Holiday Entry"
   *   confirmation ("<Festival> is a holiday. Are you sure...") that pops when
   *   hours are entered on a holiday day. Set this only for the Holiday task
   *   (the sole task meant to log hours on the holiday) so regular tasks don't
   *   pay the confirmation-wait per cell.
   */
  async fillTaskRowDaily(
    taskName: string,
    hours: string,
    skipDays: number[] = [],
    confirmHoliday = false
  ) {
    const row = this.taskRow(taskName);
    await expect(row, `Task row "${taskName}" not found in the grid.`).toBeVisible();

    const hh = hours.padStart(2, "0");
    const hourFields = row.getByRole("spinbutton", { name: "Hours" });
    // Order is MON..SUN; only the first five are weekdays.
    for (let day = 0; day < 5; day++) {
      // Leave holiday (or otherwise excluded) days blank for this task.
      if (skipDays.includes(day)) continue;
      const field = hourFields.nth(day);
      // Skip days the task does not span (rendered disabled).
      if (!(await field.isEditable().catch(() => false))) continue;
      await field.click();
      await this.page.keyboard.type(hh, { delay: 40 });
      if (confirmHoliday) await this.acceptHolidayEntryIfPresent();
      if (((await field.textContent()) ?? "").trim() !== hh) {
        await field.fill(hh);
        if (confirmHoliday) await this.acceptHolidayEntryIfPresent();
      }
    }
    // Commit the last edited cell.
    await this.page.keyboard.press("Tab");
    if (confirmHoliday) await this.acceptHolidayEntryIfPresent();
  }

  /**
   * Accept the "Holiday Entry" confirmation dialog if it is showing. EmPortal
   * raises it when hours are entered on a company holiday ("<Festival> is a
   * holiday. Are you sure you want to log hours on this day?") and blocks the
   * grid until "Yes, Continue" is clicked. No-op (short wait) when absent.
   */
  private async acceptHolidayEntryIfPresent() {
    await this.page
      .getByRole("dialog")
      .filter({ hasText: "Holiday Entry" })
      .getByRole("button", { name: "Yes, Continue" })
      .click({ timeout: 3000 })
      .catch(() => {
        /* no holiday-entry confirmation showing */
      });
  }

  /**
   * Fill every editable weekday cell across all task rows with the same hour
   * value. A cell is editable only when its task's date range covers that day;
   * disabled days, Sat/Sun and Total cells are skipped. Returns the number of
   * cells filled. Uses role-based lookup + keyboard entry (the MUI Hours section
   * can silently drop a plain fill()), matching fillTaskRowDaily.
   */
  async fillAllWeekdayHours(hours: string): Promise<number> {
    const hh = hours.padStart(2, "0");
    const hourFields = this.page.getByRole("spinbutton", { name: "Hours" });
    const total = await hourFields.count();
    let filled = 0;
    for (let i = 0; i < total; i++) {
      const field = hourFields.nth(i);
      if (!(await field.isEditable().catch(() => false))) continue;
      await field.click();
      await this.page.keyboard.type(hh, { delay: 40 });
      if (((await field.textContent()) ?? "").trim() !== hh) {
        await field.fill(hh);
      }
      filled++;
    }
    await this.page.keyboard.press("Tab");
    return filled;
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
