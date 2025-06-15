import { Page } from "@playwright/test";

export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(baseURL: string) {
    await this.page.goto(baseURL);
  }

  async login(username: string, password: string) {
    await this.page.getByRole("textbox", { name: "Email" }).fill(username);
    await this.page.getByRole("textbox", { name: "Password" }).fill(password);
  }

  async fillCaptcha(captchaText: string) {
    if (captchaText) {
      await this.page
        .getByRole("textbox", { name: "Captcha" })
        .fill(captchaText);
    }
  }

  async submitLogin() {
    await this.page.getByRole("button", { name: "Login", exact: true }).click();
  }

  async isLoggedIn(
    greetings: string,
    userDisplayName: string
  ): Promise<boolean> {
    return await this.page
      .getByText(`${greetings}, ${userDisplayName}`)
      .isVisible();
  }
}
