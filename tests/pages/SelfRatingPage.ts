import { Page, Locator, expect } from "@playwright/test";
import { RatingSection } from "../../utils/selfRatingData";

/**
 * Page Object for the EmPortal 2.0 self-rating flow (/admin/my-ratings).
 *
 * The "My Ratings" page lists appraisal periods in a table; each row has an
 * action button (Start / Continue) that opens the self-rating form. The form is
 * organised into 5 paginated sections (Capability, Creativity, Collaboration,
 * Compliance, Customer). Each criterion is an accordion card with:
 *   - a custom 5-star widget (5 <button> elements, each a lucide-star SVG). The
 *     widget supports 0.5 increments: a click on the LEFT half of a star sets
 *     "x.5", a click on the RIGHT half sets the full "x".
 *   - a "Enter description..." textbox (+ an "Enhance text" AI helper).
 * Sections are navigated with Prev / Next (or the page-number buttons); the form
 * ends with "Save Draft" (always) and "Submit" (enabled on the last page when
 * complete).
 */
export class SelfRatingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Navigation ---------------------------------------------------------

  /** Open the "My Ratings" list page. */
  async navigateToMyRatings(): Promise<void> {
    await this.page.goto("/admin/my-ratings");
    await expect(
      this.page.getByRole("heading", { name: "My Ratings", level: 1 })
    ).toBeVisible();
    // Disable CSS transitions/animations for the rest of this page's lifetime.
    // The date-picker's month-slide keeps a second (outgoing) month grid mounted
    // mid-animation and continuously transforms the day cells, so a click can
    // land on the wrong day or hit a detaching element. With animations off the
    // month switches instantly and each day cell is immediately stable.
    await this.page.addStyleTag({
      content:
        "*,*::before,*::after{transition:none!important;animation:none!important;}",
    });
  }

  /**
   * Set the "Start Date" of the My Ratings date filter to `periodStart`
   * (DD/MM/YYYY), narrowing the period table to appraisal periods on/after that
   * date.
   */
  async selectStartDate(periodStart: string): Promise<void> {
    await this.setDateFilter("Start Date", periodStart);
  }

  /**
   * Set the "End Date" of the My Ratings date filter to `periodEnd`
   * (DD/MM/YYYY). Pair with {@link selectStartDate} to bound the table to a
   * single appraisal period regardless of today's date. Without it the End Date
   * filter stays at today, so a period whose end has already passed (e.g. asking
   * for 16/06-30/06 while the clock is in July) is no longer isolated.
   */
  async selectEndDate(periodEnd: string): Promise<void> {
    await this.setDateFilter("End Date", periodEnd);
  }

  /**
   * Set one MUI date field ("Start Date" | "End Date") to a DD/MM/YYYY value by
   * driving its calendar popup.
   *
   * Why not type into the Day/Month/Year segments directly: the two fields are a
   * linked range whose refetch remounts the inputs mid-edit, so typing into the
   * second field corrupts the value of the first (e.g. Start becomes "30/06/0202")
   * and fires a request that leaves the table stuck on "Failed to fetch employee
   * ratings". Picking from the calendar sets each date atomically and avoids that.
   *
   * The day is matched by its unique `data-timestamp` (midnight local time) rather
   * than its day number, because MUI keeps the adjacent month's grid mounted
   * during the slide animation and a bare "16" would match two cells (e.g. 16 Jun
   * and 16 Jul). Node and the browser share the machine timezone (no `timezoneId`
   * override in the Playwright config), so the timestamps line up.
   */
  private async setDateFilter(
    groupName: "Start Date" | "End Date",
    value: string
  ): Promise<void> {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      throw new Error(
        `${groupName} must be formatted DD/MM/YYYY, got "${value}".`
      );
    }
    const [, ddStr, mmStr, yyyyStr] = match;
    const dd = Number(ddStr);
    const mm = Number(mmStr);
    const yyyy = Number(yyyyStr);

    const group = this.page.getByRole("group", { name: groupName });
    await expect(
      group,
      `${groupName} filter not found on the My Ratings page.`
    ).toBeVisible();

    // Open the calendar popup for this field.
    await group.getByRole("button", { name: /^Choose date/ }).click();
    const dialog = this.page.getByRole("dialog", { name: groupName });
    await expect(dialog).toBeVisible();

    // Navigate to the target month using the calendar header (e.g. "June 2026").
    const targetLabel = `${MONTH_NAMES[mm - 1]} ${yyyy}`;
    for (let i = 0; i < 36; i++) {
      const header = (
        await dialog.getByText(MONTH_YEAR_RE).first().textContent()
      )?.trim();
      if (!header) throw new Error(`Could not read the calendar header for ${groupName}.`);
      if (header === targetLabel) break;
      const [curMonth, curYear] = header.split(/\s+/);
      const shown = new Date(Number(curYear), MONTH_NAMES.indexOf(curMonth), 1);
      const target = new Date(yyyy, mm - 1, 1);
      await dialog
        .getByRole("button", {
          name: shown > target ? "Previous month" : "Next month",
        })
        .click();
    }

    // Click the exact day by its unique data-timestamp, then wait for the popup to
    // close. Matching the timestamp (not the day number) avoids the adjacent
    // month's identically-numbered cell; animations are disabled (see
    // navigateToMyRatings) so the cell is stable for a normal click.
    const timestamp = new Date(yyyy, mm - 1, dd).getTime();
    await dialog
      .locator(`[role="gridcell"][data-timestamp="${timestamp}"]`)
      .click();
    await expect(dialog).toBeHidden();

    // Confirm the field now reflects the chosen date.
    await expect(
      group.getByRole("spinbutton", { name: "Day" }),
      `${groupName} did not update to ${value}.`
    ).toHaveText(ddStr);
    await expect(
      group.getByRole("spinbutton", { name: "Month" })
    ).toHaveText(mmStr);
    await expect(
      group.getByRole("spinbutton", { name: "Year" })
    ).toHaveText(yyyyStr);
  }

  /**
   * Open the self-rating form for the period whose range starts with
   * `periodStart` (e.g. "01/06/2026"). Clicks the row's Start/Continue action.
   *
   * When `selectStartDate` has already narrowed the table to a single period,
   * the exact `periodStart` text may not appear in that row (e.g. a 2nd-half
   * period "16/06.." isolated by a "15/06.." filter), so we fall back to the
   * single remaining data row.
   */
  async openRatingPeriod(periodStart: string): Promise<void> {
    const dataRows = this.page.locator("table tbody tr");
    const textRow = dataRows.filter({ hasText: periodStart });

    // Wait for the table to settle after the date filter applies: either the
    // period's own row is present, or the filter has isolated a single row.
    await expect
      .poll(
        async () =>
          (await textRow.count()) > 0 || (await dataRows.count()) === 1,
        { message: `No rating period row found for "${periodStart}".` }
      )
      .toBe(true);

    const row =
      (await textRow.count()) > 0 ? textRow.first() : dataRows.first();

    await expect(
      row,
      `No rating period row found for "${periodStart}".`
    ).toBeVisible();

    await row
      .getByRole("button", { name: /Start|Continue|Resume|Edit|View/ })
      .click();

    // The rating form is a separate route that fetches the period, the UK-score
    // chart and previous comments before it paints, so allow well beyond the
    // default 5s for its subtitle to appear. If it never appears the form is
    // stuck on its loading spinner, which so far has been EmPortal's
    // GET /api/appraisals/{id}/ratings returning a 200 header but never
    // finishing the body (a backend hang), not a problem with this automation.
    await expect(
      this.page.getByText(
        "Rate your own performance for this appraisal period"
      ),
      "Rating form never rendered (stuck on the loading spinner). This period's " +
        "GET /api/appraisals/{id}/ratings likely hung server-side; retry when the " +
        "EmPortal backend is responsive."
    ).toBeVisible({ timeout: 30_000 });
  }

  // --- Read-only guard ----------------------------------------------------

  /** True when the period is already submitted (Submit/Save Draft unavailable). */
  async isReadOnly(): Promise<boolean> {
    const saveDraft = this.page.getByRole("button", { name: "Save Draft" });
    return !(await saveDraft.isVisible().catch(() => false));
  }

  // --- Filling ------------------------------------------------------------

  /** Read the current section heading (Capability, Creativity, ...). */
  async getCurrentSectionName(): Promise<string> {
    return (
      (await this.page.locator("h2").first().textContent())?.trim() ?? ""
    );
  }

  /** Expand all criteria in the current section so the comment boxes render. */
  async expandAll(): Promise<void> {
    const expand = this.page.getByRole("button", { name: "Expand All" });
    if (await expand.isVisible().catch(() => false)) {
      await expand.click();
    }
  }

  /**
   * The accordion block for a criterion: the nearest ancestor of the title
   * heading that also contains a description textbox. Scopes the star widget
   * and the comment box to a single criterion.
   */
  private criterionBlock(title: string): Locator {
    return this.page.locator(
      `xpath=//h3[normalize-space()=${xpathLiteral(title)}]` +
        `/ancestor::div[.//textarea or .//*[@placeholder="Enter description..."]][1]`
    );
  }

  /**
   * Set the star rating for a criterion block. Half values (x.5) click the left
   * half of star index floor(value); whole values (x) click the right half of
   * star index value-1.
   */
  private async setStarRating(block: Locator, value: string): Promise<void> {
    const v = parseFloat(value);
    const isHalf = v % 1 !== 0;
    const starIndex = isHalf ? Math.floor(v) : v - 1;

    const stars = block.locator("button:has(svg.lucide-star)");
    const star = stars.nth(starIndex);
    await star.scrollIntoViewIfNeeded();
    const box = await star.boundingBox();
    if (!box) throw new Error(`Could not resolve star ${starIndex} bounding box.`);

    await star.click({
      position: { x: isHalf ? box.width * 0.25 : box.width * 0.75, y: box.height / 2 },
    });
  }

  /**
   * Fill all criteria of the currently displayed section: set each star rating
   * and write each comment. Criteria are addressed by their title so the order
   * is asserted implicitly against the data.
   */
  async fillCurrentSection(section: RatingSection): Promise<void> {
    await this.expandAll();

    for (const criterion of section.criteria) {
      const block = this.criterionBlock(criterion.title);
      await expect(
        block,
        `Criterion "${criterion.title}" not found in section "${section.name}".`
      ).toBeVisible();

      await this.setStarRating(block, criterion.stars);

      const comment = block.getByRole("textbox", {
        name: "Enter description...",
      });
      await comment.click();
      await comment.fill("");
      await comment.fill(criterion.comment);
    }
  }

  /** Advance to the next section. */
  async clickNext(): Promise<void> {
    const next = this.page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeEnabled();
    await next.click();
  }

  /** Save the appraisal as a draft (reversible). */
  async saveDraft(): Promise<void> {
    await this.page.getByRole("button", { name: "Save Draft" }).click();
  }

  // --- Submit -------------------------------------------------------------

  /** The Submit button (present on the last section). */
  submitButton(): Locator {
    return this.page.getByRole("button", { name: "Submit", exact: true });
  }

  /**
   * Submit the appraisal. Only call when submission is intended (it permanently
   * records the self-appraisal). Handles an optional confirmation dialog.
   */
  async submit(): Promise<void> {
    const submit = this.submitButton();
    await expect(submit).toBeEnabled();
    await submit.click();

    const confirm = this.page.getByRole("button", {
      name: /^(Confirm|Yes|Ok|Submit)$/,
    });
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
  }
}

/** Month names as rendered in the MUI calendar header (e.g. "June 2026"). */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Matches a calendar header like "June 2026". */
const MONTH_YEAR_RE = new RegExp(`^(${MONTH_NAMES.join("|")})\\s+\\d{4}$`);

/** Build a safe XPath string literal (handles embedded quotes via concat()). */
function xpathLiteral(value: string): string {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  return "concat('" + value.replace(/'/g, "', \"'\", '") + "')";
}
