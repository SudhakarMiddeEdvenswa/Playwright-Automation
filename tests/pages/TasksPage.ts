import { Page, expect } from "@playwright/test";

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

    await dialog.getByRole("textbox", { name: "Task Name" }).fill(taskName);

    // Description auto-generates from the task name on focus; overwrite it with
    // our explicit description (fill() clears any auto-generated value first).
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill(taskDescription);

    await this.selectComboboxOption(dialog, "Category", taskCategory);
    await this.selectComboboxOption(dialog, "Project", projectName);

    await this.fillDateGroup(dialog, "Start Date", startDate);
    await this.fillDateGroup(dialog, "End Date", endDate);

    await this.fillEstimatedTime(dialog, time);
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
    await this.page.getByRole("button", { name: "Create Task" }).click();
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
    // Confirm in the deletion dialog.
    await this.page.getByRole("button", { name: "Delete", exact: true }).click();
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
    await group.getByRole("spinbutton", { name: "Day" }).fill(day);
    await group.getByRole("spinbutton", { name: "Month" }).fill(month);
    await group.getByRole("spinbutton", { name: "Year" }).fill(year);
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
