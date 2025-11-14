import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("https://www.google.com/");
  await page.getByRole("combobox", { name: "Search" }).click();
  await page.getByRole("combobox", { name: "Search" }).fill("emportal.me");
  await page.goto(
    "https://www.google.com/sorry/index?continue=https://www.google.com/search%3Fq%3Demportal.me%26sca_esv%3Db3c9e961bcc05c16%26source%3Dhp%26ei%3DTED_aLCsFJeN4-EPxs7C6Qo%26iflsig%3DAOw8s4IAAAAAaP9OXMW71dQ3he0gR2d1PRPQ_VuJljLy%26ved%3D0ahUKEwiwgvOWjcSQAxWXxjgGHUanMK0Q4dUDCBA%26uact%3D5%26oq%3Demportal.me%26gs_lp%3DEgdnd3Mtd2l6IgtlbXBvcnRhbC5tZTIEEAAYHjIEEAAYHki7RlCiDFiTPHADeACQAQCYAb4BoAGgC6oBAzYuN7gBA8gBAPgBAZgCEKAChwyoAgrCAgoQLhgDGOoCGI8BwgIKEAAYAxjqAhiPAcICCxAAGIAEGLEDGIoFwgILEAAYgAQYsQMYgwHCAggQABiABBixA8ICDhAAGIAEGLEDGIMBGIoFwgIOEC4YgAQYsQMY0QMYxwHCAggQLhiABBixA8ICBRAAGIAEwgILEC4YgAQYxwEYrwHCAgoQABiABBixAxgKwgIGEAAYChgewgIGEAAYCBgemAMV8QWpS7jpt5fAAJIHAzcuOaAHgUuyBwM0Ljm4B-QLwgcIMC41LjEwLjHIB00%26sclient%3Dgws-wiz%26sei%3DWED_aMLiMaXh4-EP86ecgAg&q=EgR9FTMKGNmA_ccGIjBUXruUXqvKVps2ByqYCVpju4O4bRSOpfdjM51P1Ash6zAVm32DUcIXvpORDUyS0CAyAVJaAUM"
  );
  await page
    .getByRole("link", { name: "EmPortal emportal.me https://" })
    .click();
});
