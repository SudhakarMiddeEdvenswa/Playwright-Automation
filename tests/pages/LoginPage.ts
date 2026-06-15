import { Page, expect } from "@playwright/test";

/**
 * Page Object for the EmPortal 2.0 login screen.
 *
 * EmPortal 2.0 ("Welcome Back" screen) replaced the legacy login:
 *  - The submit button is now labelled "Sign In" (was "Login").
 *  - There is NO CAPTCHA anymore, so the OCR/Tesseract step is gone.
 *  - A successful login lands on an authenticated /admin/* route (the user's
 *    own employee profile) instead of "#/home", and there is no
 *    "Good Morning, <name>" greeting.
 */
export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Open the application at the given base URL. */
  async navigate(baseURL: string) {
    await this.page.goto(baseURL);
  }

  /** Enter the email and password credentials. */
  async login(username: string, password: string) {
    await this.page.getByRole("textbox", { name: "Email" }).fill(username);
    await this.page.getByRole("textbox", { name: "Password" }).fill(password);
  }

  /** Click the "Sign In" button to submit the login form. */
  async submitLogin() {
    await this.page
      .getByRole("button", { name: "Sign In", exact: true })
      .click();
  }

  /**
   * Wait until the authenticated shell is rendered. EmPortal 2.0 redirects to an
   * /admin/* route and shows the left navigation ("Project Execution") plus the
   * user menu, so we use those as the login-success signal.
   */
  async waitForLogin(timeout = 20000): Promise<void> {
    await this.page.waitForURL(/\/admin\//, { timeout });
    await expect(
      this.page.getByRole("button", { name: "Project Execution" })
    ).toBeVisible({ timeout });
  }

  /** True when the authenticated user menu shows the expected display name. */
  async isLoggedIn(userDisplayName: string): Promise<boolean> {
    return await this.page
      .getByRole("button", { name: "User menu" })
      .getByText(userDisplayName)
      .isVisible()
      .catch(() => false);
  }
}
