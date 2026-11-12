import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';

test('a user who has not accepted must read the policy to the end first', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 }); // short enough that the policy scrolls
  await mockAuthApi(page, { loggedIn: true, fairPlayAccepted: false });
  await page.goto('/');

  await expect(page).toHaveURL(/#\/fair-play/);
  const accept = page.getByTestId('accept-fair-play');
  await expect(accept).toBeDisabled();
  await expect(page.getByTestId('scroll-hint')).toHaveText('Scroll to the end to continue.');

  await page.getByTestId('policy-scroll').evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(accept).toBeEnabled();
  await accept.click();

  await expect(page.getByTestId('board')).toBeVisible();
  await page.goto('/#/fair-play'); // already accepted: straight back to the board
  await expect(page.getByTestId('board')).toBeVisible();
});

test('the battle tab is gated too', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true, fairPlayAccepted: false });
  await page.goto('/#/battle?board=8/8/8/8/8/8/8/8');
  await expect(page).toHaveURL(/#\/fair-play/);
});

test('About stays readable without accepting', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true, fairPlayAccepted: false });
  await page.goto('/#/about');
  await expect(page.getByTestId('fair-play-policy')).toBeVisible();
  await expect(page).toHaveURL(/#\/about/);
});
