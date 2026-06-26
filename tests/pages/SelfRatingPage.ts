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
  }

  /**
   * Set the "Start Date" of the My Ratings date filter to `periodStart`
   * (DD/MM/YYYY), narrowing the period table to appraisal periods on/after that
   * date. The filter is a MUI segmented date field: three contenteditable
   * spinbuttons (Day / Month / Year). Each segment is clicked, then its digits
   * are typed in quick succession so MUI combines them (it resets the digit
   * buffer after a short idle, so a per-segment click + fast type is the
   * reliable way to set a leading-zero day like "01").
   */
  async selectStartDate(periodStart: string): Promise<void> {
    const match = periodStart.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      throw new Error(
        `periodStart must be formatted DD/MM/YYYY, got "${periodStart}".`
      );
    }
    const [, dd, mm, yyyy] = match;

    const startGroup = this.page.getByRole("group", { name: "Start Date" });
    await expect(
      startGroup,
      "Start Date filter not found on the My Ratings page."
    ).toBeVisible();

    const setSegment = async (name: string, digits: string) => {
      const segment = startGroup.getByRole("spinbutton", { name });
      await segment.click();
      await segment.pressSequentially(digits, { delay: 60 });
    };

    await setSegment("Day", dd);
    await setSegment("Month", mm);
    await setSegment("Year", yyyy);

    // Confirm each segment reflects the requested date before the table
    // re-filters. (The field's hidden textbox is aria-hidden, so the visible
    // spinbutton segments are the reliable thing to assert on.)
    await expect(
      startGroup.getByRole("spinbutton", { name: "Day" }),
      `Start Date day did not update to ${dd}.`
    ).toHaveText(dd);
    await expect(
      startGroup.getByRole("spinbutton", { name: "Month" })
    ).toHaveText(mm);
    await expect(
      startGroup.getByRole("spinbutton", { name: "Year" })
    ).toHaveText(yyyy);
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

    await expect(
      this.page.getByText("Rate your own performance for this appraisal period")
    ).toBeVisible();
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

/** Build a safe XPath string literal (handles embedded quotes via concat()). */
function xpathLiteral(value: string): string {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  return "concat('" + value.replace(/'/g, "', \"'\", '") + "')";
}
