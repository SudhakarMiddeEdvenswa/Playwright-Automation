import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object for the EmPortal 2.0 "Task Management" page (/admin/tasks).
 *
 * Key differences from the legacy app:
 *  - Reached via the left-nav "Project Execution" fly-out -> "Tasks" (the old
 *    "Manage Tasks Manage Tasks" button is gone).
 *  - "Add Tasks" opens an "Add New Task" dialog whose fields were renamed:
 *      Task Description -> Description, Projects -> Project,
 *      Task Categories  -> Category,    hh:mm   -> Estimated Time (HH:MM).
 *  - Start/End dates are MUI date pickers with Day/Month/Year spinbuttons
 *    (displayed as DD/MM/YYYY) instead of a single date textbox.
 *  - The dialog is confirmed with "Create Task" (was "Save").
 */
export class TasksPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Open Task Management via the "Project Execution" fly-out menu. */
  async navigateToManageTasks() {
    await this.page
      .getByRole("button", { name: "Project Execution" })
      .hover();
    await this.page.getByRole("link", { name: "Tasks", exact: true }).click();
    await expect(
      this.page.getByRole("heading", { name: "Task Management" })
    ).toBeVisible();
  }

  /** Open the "Add New Task" dialog. */
  async clickAddTasks() {
    await this.page.getByRole("button", { name: "Add Tasks" }).click();
    await expect(
      this.page.getByRole("dialog", { name: "Add New Task" })
    ).toBeVisible();
  }

  /**
   * Fill the "Add New Task" dialog.
   *
   * @param startDate / endDate  ISO strings ("YYYY-MM-DD"), e.g. "2026-06-15".
   * @param time                 Estimated time, e.g. "05:00" / "5:00" / "10:00".
   */
  async fillTaskDetails(
    taskName: string,
    time: string,
    taskDescription: string,
    startDate: string,
    endDate: string,
    projectName: string,
    taskCategory: string
  ) {
    const dialog = this.page.getByRole("dialog", { name: "Add New Task" });
    const nameField = dialog.getByRole("textbox", { name: "Task Name" });
    const descField = dialog.getByRole("textbox", { name: "Description" });

    await nameField.fill(taskName);

    // Description auto-generates from the task name on focus; overwrite it with
    // our explicit description (fill() clears any auto-generated value first).
    await descField.fill(taskDescription);

    await this.selectComboboxOption(dialog, "Category", taskCategory);
    await this.selectComboboxOption(dialog, "Project", projectName);

    await this.fillDateGroup(dialog, "Start Date", startDate);
    await this.fillDateGroup(dialog, "End Date", endDate);

    await this.fillEstimatedTime(dialog, time);

    // The dialog's async description auto-generate can reset the text inputs
    // mid-fill; re-apply any that did not survive so the form is valid to submit.
    if ((await nameField.inputValue()) !== taskName) {
      await nameField.fill(taskName);
      await this.fillEstimatedTime(dialog, time);
    }
    await expect(nameField).toHaveValue(taskName);

    // The Description field AI-auto-generates from the task name on first focus.
    // That async generation lands a few seconds later and OVERWRITES whatever we
    // typed, often with markdown ("**Task Description: ...") that starts with a
    // non-letter and trips the "Must start with a capital letter" rule, blocking
    // "Create Task". The generation is one-shot per dialog, so re-apply our
    // explicit (capital-first) description LAST, after it has settled.
    await this.setDescriptionRobustly(descField, taskDescription);
  }

  /**
   * Force the Description field to hold our explicit text, defeating the async
   * AI auto-generate that overwrites it. Overwrites, waits for any pending
   * generation to land, and retries until our value sticks.
   */
  private async setDescriptionRobustly(
    descField: Locator,
    description: string
  ) {
    for (let attempt = 0; attempt < 6; attempt++) {
      await descField.click();
      await descField.press("ControlOrMeta+a");
      await descField.press("Delete");
      await descField.fill(description);
      // Let any pending auto-generate resolve; if it clobbers our value we retry.
      await this.page.waitForTimeout(2500);
      if ((await descField.inputValue()) === description) return;
    }
    await expect(descField).toHaveValue(description);
  }

  /**
   * Fill the masked "Estimated Time (HH:MM)" field robustly. A plain fill() can
   * silently fail to register on this input, so verify the value stuck and fall
   * back to clearing + sequential typing.
   */
  private async fillEstimatedTime(
    dialog: ReturnType<Page["getByRole"]>,
    time: string
  ) {
    const value = this.normalizeTime(time);
    const field = dialog.getByRole("textbox", {
      name: "Estimated Time (HH:MM)",
    });
    await field.click();
    await field.fill(value);
    if ((await field.inputValue()) !== value) {
      await field.click();
      await field.press("ControlOrMeta+a");
      await field.press("Delete");
      await field.pressSequentially(value);
    }
    await expect(field).toHaveValue(value);
  }

  /** Confirm task creation ("Create Task" replaced the old "Save" button). */
  async saveTask() {
    const createButton = this.page.getByRole("button", { name: "Create Task" });
    await expect(createButton).toBeEnabled();
    await createButton.click();
    // The dialog closes once the task is created.
    await expect(
      this.page.getByRole("dialog", { name: "Add New Task" })
    ).toBeHidden({ timeout: 15000 });
  }

  /** Delete a task by name (skips rows whose timesheet is already submitted). */
  async deleteTaskByName(taskName: string) {
    const row = this.page.getByRole("row", { name: new RegExp(escapeRegExp(taskName)) }).first();
    const deleteButton = row.getByLabel("Click to Delete");
    await deleteButton.waitFor({ state: "visible" });
    await deleteButton.click();
    // Confirm in the "Delete Task" dialog.
    await this.page.getByRole("button", { name: "Delete", exact: true }).click();
  }

  /**
   * Delete every (deletable) task row matching both a task name and a date,
   * scoping deletion to a single week. Rows whose timesheet is already submitted
   * have a disabled delete button and are left untouched. Returns the count
   * deleted. EmPortal rejects creating duplicate tasks, so callers use this to
   * clear a week before (re)creating tasks, making the flow idempotent.
   * @param dateDisplay a date shown in the row, e.g. "15/06/2026".
   */
  async deleteTasksForWeek(
    taskName: string,
    dateDisplay: string
  ): Promise<number> {
    // Filter the table to this task so matching rows are not hidden on a later
    // page (the table paginates at 10 rows).
    const search = this.page.getByRole("textbox", {
      name: "Search tasks by name, project, or description...",
    });
    await search.fill("");
    await search.fill(taskName);
    await search.press("Enter");

    const matches = () =>
      this.page
        .getByRole("row")
        .filter({ hasText: taskName })
        .filter({ hasText: dateDisplay });

    // Wait for the (debounced) search results to settle before counting, so we
    // don't read an empty mid-filter table and exit the loop early.
    await expect
      .poll(() => matches().count(), { timeout: 6000 })
      .toBeGreaterThan(0)
      .catch(() => undefined);

    let deleted = 0;
    for (let guard = 0; guard < 40; guard++) {
      const before = await matches().count();
      if (before === 0) break;

      const row = matches().first();
      const deleteButton = row.getByLabel("Click to Delete");
      if (!(await deleteButton.isEnabled().catch(() => false))) break;

      await deleteButton.click();
      await this.page
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      // Wait for the row count to actually drop; stop if it doesn't (stuck row).
      const dropped = await expect
        .poll(() => matches().count(), { timeout: 10000 })
        .toBeLessThan(before)
        .then(() => true)
        .catch(() => false);
      if (!dropped) break;
      deleted++;
    }

    // Clear the search filter so the table is unfiltered for later steps.
    await search.fill("");
    await this.page.waitForTimeout(300);
    return deleted;
  }

  // --- Helpers ------------------------------------------------------------

  /** Open a MUI combobox and pick the option with the exact given label. */
  private async selectComboboxOption(
    dialog: ReturnType<Page["getByRole"]>,
    comboName: string,
    optionName: string
  ) {
    await dialog.getByRole("combobox", { name: comboName }).click();
    await this.page
      .getByRole("option", { name: optionName, exact: true })
      .click();
  }

  /**
   * Fill a MUI date picker group (Day/Month/Year sections) from an ISO date and
   * verify the formatted value stuck. Scoped to the dialog so it never matches a
   * date group elsewhere on the page. A plain section fill() can drop digits, so
   * fall back to focusing the Day section and typing all 8 digits sequentially.
   * @param groupName "Start Date" | "End Date"
   * @param isoDate   "YYYY-MM-DD"
   */
  private async fillDateGroup(
    dialog: ReturnType<Page["getByRole"]>,
    groupName: string,
    isoDate: string
  ) {
    const [year, month, day] = isoDate.split("-");
    const group = dialog.getByRole("group", { name: groupName });
    const dayField = group.getByRole("spinbutton", { name: "Day" });
    const monthField = group.getByRole("spinbutton", { name: "Month" });
    const yearField = group.getByRole("spinbutton", { name: "Year" });

    // Focus the Day section and type all 8 digits; the MUI date field
    // auto-advances Day -> Month -> Year. This is far more reliable than fill()
    // on each section, which can intermittently drop digits.
    await dayField.click();
    await this.page.keyboard.type(`${day}${month}${year}`, { delay: 40 });

    // Verify; retry once per section with fill() as a fallback.
    if (((await dayField.textContent()) ?? "").trim() !== day)
      await dayField.fill(day);
    if (((await monthField.textContent()) ?? "").trim() !== month)
      await monthField.fill(month);
    if (((await yearField.textContent()) ?? "").trim() !== year)
      await yearField.fill(year);

    await expect(dayField).toHaveText(day);
    await expect(monthField).toHaveText(month);
    await expect(yearField).toHaveText(year);
  }

  /** Normalize "5:00" -> "05:00" so the HH:MM field accepts it. */
  private normalizeTime(time: string): string {
    const [h, m = "00"] = time.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }
}

/** Escape user-provided text for safe use inside a RegExp (row name matching). */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
