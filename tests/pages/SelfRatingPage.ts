import { Page, Locator, expect } from "@playwright/test";
import { RatingSection } from "../../utils/selfRatingData";

/**
 * Page Object for the EmPortal 2.0 self-rating flow (/admin/my-ratings).
 *
 * The "My Ratings" page lists appraisal periods in a table; each row has an
 * action button (Start / Continue) that opens the self-rating form. The list's
 * date filter defaults to the current month, so the current period's row is
 * already visible and is opened directly by its start date - no separate date
 * navigation is required (the old month-chevron/date-range controls were removed
 * in the refresh).
 *
 * The self-rating form (post-refresh) shows the 5 sections one at a time,
 * navigated with a MUI pagination control (pages 1..5 / "Go to next page"). Each
 * section heading is an <h5> (Capability, Creativity, Collaboration, Compliance,
 * Customer). Each criterion is a MUI Accordion whose title is a <p>; inside it:
 *   - a custom star widget: `div[role="slider"][aria-label="Rating"]` holding 5
 *     star <span> elements. It supports 0.5 increments - clicking the LEFT half
 *     of star N sets "N-0.5", the RIGHT half sets "N"; aria-valuenow reflects the
 *     chosen value.
 *   - an "Enter your comments..." textbox (+ an "Enhance" AI helper).
 * The form ends with "Save Draft" (always) and "Submit" (last page when complete).
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
    // Disable CSS transitions/animations for stability (accordion expand, star
    // hover, section pagination), so clicks land on settled, non-animating cells.
    await this.page.addStyleTag({
      content:
        "*,*::before,*::after{transition:none!important;animation:none!important;}",
    });
  }

  /**
   * Open the self-rating form for the period whose range starts with
   * `periodStart` (e.g. "01/09/2026"). The list defaults to the current month, so
   * the current period's row is present; it is matched by its start date and its
   * Start/Continue action is clicked. When the table has already been narrowed to
   * a single row, that row is used even if its text does not contain periodStart.
   */
  async openRatingPeriod(periodStart: string): Promise<void> {
    const dataRows = this.page.locator("table tbody tr");
    const textRow = dataRows.filter({ hasText: periodStart });

    // Wait for the table to settle: either the period's own row is present, or a
    // single row remains.
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

    // The action is an icon button labelled Start/Continue/... (accessible name).
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

  /** True when the period is already submitted (Save Draft unavailable). */
  async isReadOnly(): Promise<boolean> {
    const saveDraft = this.page.getByRole("button", { name: "Save Draft" });
    return !(await saveDraft.isVisible().catch(() => false));
  }

  // --- Filling ------------------------------------------------------------

  /** Read the current section heading (Capability, Creativity, ...). */
  async getCurrentSectionName(): Promise<string> {
    // The section heading is the single <h5> in the form area.
    return (
      (await this.page.locator("main h5").first().textContent())?.trim() ?? ""
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
   * The accordion block for a criterion: the MuiAccordion whose header shows the
   * criterion title. Scopes the star widget and the comment box to a single
   * criterion. Titles render as <p> (not headings) since the refresh.
   */
  private criterionBlock(title: string): Locator {
    return this.page.locator(
      `xpath=//p[normalize-space()=${xpathLiteral(title)}]` +
        `/ancestor::div[contains(@class,"MuiAccordion-root")][1]`
    );
  }

  /**
   * Set the star rating for a criterion block. Half values (x.5) click the left
   * half of star index floor(value); whole values (x) click the right half of
   * star index value-1. The widget is a div[role="slider"][aria-label="Rating"]
   * containing 5 star <span> elements (left half = x.5, right half = x).
   */
  private async setStarRating(block: Locator, value: string): Promise<void> {
    const v = parseFloat(value);
    const isHalf = v % 1 !== 0;
    const starIndex = isHalf ? Math.floor(v) : v - 1;

    const stars = block.locator(
      '[role="slider"][aria-label="Rating"] span.relative'
    );
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

      const comment = block.getByPlaceholder("Enter your comments...");
      await comment.click();
      await comment.fill("");
      await comment.fill(criterion.comment);
    }
  }

  /** Advance to the next section (MUI pagination "Go to next page"). */
  async clickNext(): Promise<void> {
    const next = this.page.getByRole("button", { name: "Go to next page" });
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
