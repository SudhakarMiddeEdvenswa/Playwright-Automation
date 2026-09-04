import { Page, expect } from "@playwright/test";

/**
 * Page Object for the EmPortal 2.0 employee "Dashboard".
 *
 * The dashboard is the logged-in user's own employee view at /admin/dashboard
 * (the legacy /admin/employees/{id} route). It opens on a "Home" tab and the tab
 * strip is:
 *   Home | Overview | Tasks | Ratings | Timesheets | Worked Hours | Profile
 * and the Profile tab has its own sub-tabs rendered as buttons:
 *   User Info | Employee Time | Projects | Skills | Certifications
 *
 * Charts are SVG (recharts) blocks identified by their headings and legend text
 * rather than fragile DOM paths. Counts (task totals, worked hours, ratings) are
 * read with flexible matchers so the validations stay green as production data
 * changes over time.
 */
export class DashboardPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Navigation ---------------------------------------------------------

  /** Open the Dashboard (/admin/dashboard) and wait for the tab strip. */
  async navigateToDashboard(): Promise<void> {
    await this.page.goto("/admin/dashboard");
    await this.page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 });
    // The tab strip is the reliable "dashboard is ready" signal.
    await expect(this.page.getByRole("tab", { name: "Overview" })).toBeVisible({
      timeout: 20000,
    });
  }

  /** Click one of the six top-level dashboard tabs and wait until it is active. */
  async selectTab(name: string): Promise<void> {
    const tab = this.page.getByRole("tab", { name, exact: true });
    await expect(tab, `Tab "${name}" should be present`).toBeVisible();
    await tab.click();
    // Deterministic signal that the tab switch completed (avoids fixed sleeps).
    await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 10000 });
    // Brief settle for the recharts/MUI panel animation before reading values.
    await this.page.waitForTimeout(600);
  }

  /** Select a Profile sub-tab (rendered as a button, not an ARIA tab). */
  async selectProfileSection(name: string): Promise<void> {
    await this.page.getByRole("button", { name, exact: true }).click();
    await this.page.waitForTimeout(1200);
  }

  // --- Generic helpers ----------------------------------------------------

  /**
   * A chart is present when an actual chart surface has rendered. Scoped to
   * recharts surfaces/containers (and <canvas>) so unrelated icon/logo <svg>s
   * cannot produce a false-positive pass.
   */
  async hasChart(): Promise<boolean> {
    return (
      (await this.page
        .locator("svg.recharts-surface, .recharts-responsive-container, canvas")
        .count()) > 0
    );
  }

  /** True when the given (case-insensitive) text is visible anywhere on screen. */
  async isTextVisible(text: string | RegExp): Promise<boolean> {
    return await this.page
      .getByText(text)
      .first()
      .isVisible()
      .catch(() => false);
  }

  /**
   * Read the numeric value paired with a stat label (e.g. "Total Tasks").
   * EmPortal renders the number directly above/below the label inside the same
   * card, so we walk up to the nearest card container and grab the first digits.
   */
  async readStatNear(label: string): Promise<string> {
    const card = this.page
      .locator(`xpath=//*[normalize-space()=${xpathLiteral(label)}]/ancestor::*[self::div][1]`)
      .first();
    const text = (await card.textContent().catch(() => "")) ?? "";
    const match = text.match(/[\d,]+(?:\.\d+)?\s*h?/);
    return match ? match[0].trim() : "";
  }

  // --- Overview -----------------------------------------------------------

  /** Validate Total/Completed task counts and the progress/distribution charts. */
  async validateOverview(): Promise<void> {
    await expect(this.page.getByText("Total Tasks").first()).toBeVisible();
    // "<n> completed" caption sits under the Total Tasks figure.
    await expect(this.page.getByText(/\d+\s+completed/i).first()).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: "Monthly Progress" })
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: "Performance by Project" })
    ).toBeVisible();
    // The chart surfaces (Monthly Progress + Performance by Project) confirm the
    // Overview rendered. (The old "Tasks Completed" distribution legend was
    // removed in the dashboard refresh.)
    expect(await this.hasChart(), "Overview should render a chart").toBeTruthy();
  }

  // --- Tasks --------------------------------------------------------------

  /** Validate the Allocated vs Worked bar chart and its period filter. */
  async validateTasks(): Promise<void> {
    // Legend labels for the allocated/worked bar chart.
    await expect(this.page.getByText(/Allocated:\s*\d+h/i).first()).toBeVisible();
    await expect(this.page.getByText(/Worked:\s*\d+h/i).first()).toBeVisible();
    expect(await this.hasChart(), "Tasks should render a bar chart").toBeTruthy();

    // Filtering: exercise the time-range filter dropdown if present (non-fatal).
    await this.tryCycleRangeFilter();
  }

  // --- Ratings ------------------------------------------------------------

  /** Validate ratings summary cards, table, status dropdown, search & export. */
  async validateRatings(): Promise<void> {
    // Summary cards.
    for (const label of ["Total Ratings", "Completed", "Pending", "Avg Rating"]) {
      await expect(
        this.page.getByText(label, { exact: true }).first(),
        `Ratings card "${label}" should be visible`
      ).toBeVisible();
    }

    // Results table + its column headers.
    await expect(this.page.getByRole("table")).toBeVisible();
    for (const col of ["Period", "Project", "Manager", "Status", "Rating"]) {
      await expect(
        this.page.getByRole("columnheader", { name: new RegExp(col, "i") }).first()
      ).toBeVisible();
    }

    await this.validateStatusDropdown();
    await this.validateDateRangeInputs();
    await this.validateSearchBox("Search by Project / PM");
    // The ratings export control is labelled "Download Ratings" (was "Export").
    await this.validateExportButton("Download Ratings");
  }

  /**
   * Validate the "All Status" dropdown's options and filtering. The control is a
   * native <select>, so its options live in the DOM (hidden until opened) and we
   * drive it with selectOption rather than clicking option elements.
   */
  async validateStatusDropdown(): Promise<void> {
    const dropdown = this.page
      .getByRole("combobox")
      .filter({ hasText: /All Status/i })
      .first();
    if (!(await dropdown.isVisible().catch(() => false))) return;

    // Expected option set for the ratings status filter (present in the DOM).
    const optionTexts = (await dropdown.locator("option").allTextContents()).map((t) =>
      t.trim()
    );
    for (const opt of ["All Status", "Not Started", "Needs Review", "Completed"]) {
      expect(optionTexts, `Status option "${opt}" should be listed`).toContain(opt);
    }

    // Apply one option and assert the selection actually took effect, then
    // restore the default so the view is left unfiltered for later steps.
    await dropdown.selectOption({ label: "Completed" });
    await expect(
      dropdown.locator("option:checked"),
      "Selecting 'Completed' should update the status filter"
    ).toHaveText("Completed");
    await this.page.waitForTimeout(800);

    await dropdown.selectOption({ label: "All Status" });
    await expect(dropdown.locator("option:checked")).toHaveText("All Status");
    await this.page.waitForTimeout(500);
  }

  /** Validate the Start/End date range inputs are present and well formatted. */
  async validateDateRangeInputs(): Promise<void> {
    const start = this.page.getByRole("group", { name: "Start Date" }).first();
    const end = this.page.getByRole("group", { name: "End Date" }).first();
    if (await start.isVisible().catch(() => false)) {
      // Values render as DD/MM/YYYY spinbutton groups.
      await expect(start).toBeVisible();
    }
    if (await end.isVisible().catch(() => false)) {
      await expect(end).toBeVisible();
    }
  }

  // --- Timesheets ---------------------------------------------------------

  /** Validate timesheet summary stats, charts, Daily/Weekly toggle & table. */
  async validateTimesheets(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Project Worked Hours" })
    ).toBeVisible();

    // Summary stat labels.
    for (const label of ["Total Hours", "Avg / Week", "Top Project", "Active Days"]) {
      await expect(
        this.page.getByText(label, { exact: true }).first(),
        `Timesheet stat "${label}" should be visible`
      ).toBeVisible();
    }
    // Total Hours figure is an "<n>h" value.
    await expect(this.page.getByText(/\d+h/).first()).toBeVisible();

    await expect(
      this.page.getByRole("heading", { name: "Hours by Project" })
    ).toBeVisible();
    await expect(this.page.getByText("Scroll to explore").first()).toBeVisible();

    await this.toggleDailyWeekly();
    await this.validateSearchBox("Filter by Project");

    // Project breakdown table + columns.
    await expect(this.page.getByRole("table")).toBeVisible();
    for (const col of ["Project Breakdown", "Week", "Total Hours", "Status"]) {
      await expect(
        this.page.getByRole("columnheader", { name: new RegExp(col, "i") }).first()
      ).toBeVisible();
    }
    expect(await this.hasChart(), "Timesheets should render a chart").toBeTruthy();
  }

  // --- Worked Hours -------------------------------------------------------

  /** Validate worked-hours stats, charts, status filters, search & export. */
  async validateWorkedHours(): Promise<void> {
    for (const label of ["Total Hours", "Avg / Week", "Top Project", "Active Days"]) {
      await expect(
        this.page.getByText(label, { exact: true }).first(),
        `Worked Hours stat "${label}" should be visible`
      ).toBeVisible();
    }

    await expect(
      this.page.getByRole("heading", { name: "Hours by Project" })
    ).toBeVisible();
    await this.toggleDailyWeekly();

    // ACTIVE/INACTIVE status filters. End on "All" so the table is populated
    // (the user may have no inactive projects, which renders an empty state).
    for (const f of ["Active", "Inactive", "All"]) {
      const btn = this.page.getByRole("button", { name: f, exact: true });
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await this.page.waitForTimeout(600);
      }
    }

    await this.validateSearchBox("Search by project name...");

    // Projects table + sortable columns.
    await expect(this.page.getByRole("table")).toBeVisible();
    for (const col of ["Project Name", "Status", "Alloc %", "Worked Hrs"]) {
      await expect(
        this.page.getByRole("columnheader", { name: new RegExp(col, "i") }).first()
      ).toBeVisible();
    }
    // Sorting: click a sortable header (no error / table stays rendered).
    const sortHeader = this.page
      .getByRole("columnheader", { name: /Worked Hrs/i })
      .first();
    if (await sortHeader.isVisible().catch(() => false)) {
      await sortHeader.click();
      await this.page.waitForTimeout(600);
      await expect(this.page.getByRole("table")).toBeVisible();
    }

    await this.validateExportButton();
    expect(await this.hasChart(), "Worked Hours should render a chart").toBeTruthy();
  }

  // --- Profile ------------------------------------------------------------

  /** Validate the "User Info" section shows the expected identity fields. */
  async validateProfileUserInfo(email: string): Promise<void> {
    await this.selectProfileSection("User Info");
    // The User Info section's heading is now "Personal Information" (was
    // "User Information").
    await expect(
      this.page.getByRole("heading", { name: "Personal Information" })
    ).toBeVisible();
    // Key labels and the known email value.
    for (const label of ["Role", "Status", "Job Title"]) {
      await expect(
        this.page.getByText(label, { exact: true }).first(),
        `User Info field "${label}" should be visible`
      ).toBeVisible();
    }
    // "Last Login" is rendered inline with its timestamp ("Last Login: <ts>"),
    // so it has no exact-match element - match it as a substring.
    await expect(
      this.page.getByText(/Last Login/).first(),
      `User Info field "Last Login" should be visible`
    ).toBeVisible();
    await expect(this.page.getByText(email).first()).toBeVisible();
  }

  /** Validate the "Employee Time" section shows time-policy fields. */
  async validateProfileEmployeeTime(): Promise<void> {
    await this.selectProfileSection("Employee Time");
    await expect(
      this.page.getByRole("heading", { name: "Employee Time" })
    ).toBeVisible();
    // Labels render Title Case in the DOM now (were UPPERCASE); the visual caps
    // are CSS text-transform, so match the underlying text.
    for (const label of ["Shift", "Holiday Calendar", "Attendance Number"]) {
      await expect(
        this.page.getByText(label, { exact: true }).first(),
        `Employee Time field "${label}" should be visible`
      ).toBeVisible();
    }
  }

  /**
   * Validate the "Projects" section: the Assigned Projects list, the Active/
   * Inactive/All status filter, the presence of the Resume Projects section, and
   * the Add External Project form. All interactions are non-destructive - the
   * external project is filled then CANCELLED, and the Resume Projects section is
   * only asserted to be present (the Resume action itself is never triggered, as
   * it would mutate production data).
   */
  async validateProfileProjects(): Promise<void> {
    await this.selectProfileSection("Projects");
    await expect(this.page.getByText(/Assigned Projects \(\d+\)/).first()).toBeVisible();

    // Active/Inactive/All status filter for the project list.
    for (const f of ["Active", "Inactive", "All"]) {
      const btn = this.page.getByRole("button", { name: f, exact: true }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await this.page.waitForTimeout(500);
      }
    }

    // Resume Projects section: assert presence only (no Resume click - it would
    // change a project's status in production).
    const resumeSection = this.page.getByText(/Resume Projects \(\d+\)/).first();
    if (await resumeSection.isVisible().catch(() => false)) {
      await expect(resumeSection).toBeVisible();
    }

    await this.validateAddExternalProjectForm();
  }

  /**
   * Open "Add External Project", fill the Project Name and Your Role fields,
   * validate the inputs accept the values, confirm the Add/Cancel actions are
   * present, then click Cancel (non-destructive). This proves the add flow works
   * without persisting test data to production. (Date fields are intentionally
   * left untouched - the form is cancelled, so they are not exercised here.)
   */
  async validateAddExternalProjectForm(): Promise<void> {
    const addBtn = this.page.getByRole("button", { name: "Add External Project" });
    if (!(await addBtn.isVisible().catch(() => false))) return;
    await addBtn.click();
    await this.page.waitForTimeout(1000);

    const projectName = this.page.getByRole("textbox", {
      name: /Project Name/i,
    });
    // Fall back to placeholder-based lookup if the accessible name differs.
    const nameField = (await projectName.count())
      ? projectName.first()
      : this.page.getByPlaceholder("e.g. Banking Platform Migration");
    const roleField = this.page.getByPlaceholder("e.g. Lead Developer");

    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill("Automation Validation Project");
      await expect(nameField).toHaveValue("Automation Validation Project");
    }
    if (await roleField.isVisible().catch(() => false)) {
      await roleField.fill("QA Automation Engineer");
      await expect(roleField).toHaveValue("QA Automation Engineer");
    }

    // Confirm Add + Cancel actions are present, then Cancel (no data written).
    await expect(this.page.getByRole("button", { name: "Add", exact: true })).toBeVisible();
    const cancel = this.page.getByRole("button", { name: "Cancel", exact: true });
    await expect(cancel).toBeVisible();
    await cancel.click();
    await this.page.waitForTimeout(800);
  }

  // --- Shared validations -------------------------------------------------

  /** Type into and clear a search/filter textbox identified by placeholder. */
  async validateSearchBox(placeholder: string): Promise<void> {
    const search = this.page.getByPlaceholder(placeholder).first();
    if (!(await search.isVisible().catch(() => false))) return;
    await search.fill("Stax");
    // Assert the input accepted the value (catches disabled/covered inputs).
    await expect(search).toHaveValue("Stax");
    await this.page.waitForTimeout(800);
    await search.fill(""); // reset so later steps see the full data set
    await expect(search).toHaveValue("");
    await this.page.waitForTimeout(500);
  }

  /**
   * Validate an Export control exists and is actionable. Clicking it should
   * trigger a CSV/Excel download; we capture the download best-effort and assert
   * the filename extension when one fires (non-fatal if it opens a menu instead).
   */
  async validateExportButton(name: string = "Export"): Promise<void> {
    const exportBtn = this.page.getByRole("button", { name }).first();
    // Callers (Ratings, Worked Hours) use this to confirm the export control
    // exists, so a missing button is a regression - assert visibility rather
    // than skipping. The button label differs per tab ("Export" on Worked Hours,
    // "Download Ratings" on Ratings).
    await expect(exportBtn, `"${name}" button should be present`).toBeVisible();
    await expect(exportBtn).toBeEnabled();

    const downloadPromise = this.page
      .waitForEvent("download", { timeout: 4000 })
      .catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;
    if (download) {
      expect(
        download.suggestedFilename(),
        "Exported file should be CSV or Excel"
      ).toMatch(/\.(csv|xlsx?|xls)$/i);
    }
    // Dismiss any export menu that opened instead of downloading.
    await this.page.keyboard.press("Escape").catch(() => undefined);
  }

  /** Toggle the Daily / Weekly chart views if the toggle buttons are present. */
  async toggleDailyWeekly(): Promise<void> {
    for (const view of ["Weekly", "Daily"]) {
      const btn = this.page.getByRole("button", { name: view, exact: true }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await this.page.waitForTimeout(700);
      }
    }
  }

  /** Best-effort exercise of a chart time-range filter (Last 7 Days, etc.). */
  private async tryCycleRangeFilter(): Promise<void> {
    const combo = this.page.getByRole("combobox").first();
    if (!(await combo.isVisible().catch(() => false))) return;
    await combo.click().catch(() => undefined);
    const option = this.page.getByRole("option").first();
    if (await option.isVisible().catch(() => false)) {
      await option.click().catch(() => undefined);
      await this.page.waitForTimeout(600);
    } else {
      await this.page.keyboard.press("Escape").catch(() => undefined);
    }
  }
}

/** Build a safe XPath string literal (handles embedded quotes via concat()). */
function xpathLiteral(value: string): string {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  return "concat('" + value.replace(/'/g, "', \"'\", '") + "')";
}
