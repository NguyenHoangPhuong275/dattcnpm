import { test, expect } from '@playwright/test';
import { seedOtp, seedPlace, cleanup, closeDb } from './helpers/db';

test.describe('Happy path smoke', () => {
  const email = `e2e_${Date.now()}@example.test`;
  const password = 'Password123!';
  const otp = '123456';
  let tripId: string | undefined;
  let placeId: string | undefined;

  test.afterAll(async () => {
    await cleanup({ email, tripId, placeId });
    await closeDb();
  });

  test('register → OTP → login → create trip → add stop → checklist', async ({ page }) => {
    await seedOtp(email, otp);
    const register = await page.request.post('/api/auth/verify-otp', {
      data: { email, otp, password, fullName: 'E2E User' },
    });
    expect(register.ok(), await register.text()).toBeTruthy();

    const login = await page.request.post('/api/auth/login', { data: { email, password } });
    expect(login.ok(), await login.text()).toBeTruthy();

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tripRes = await page.request.post('/api/trips', {
      data: {
        title: 'E2E Trip',
        destination: 'Đà Nẵng',
        startDate: start,
        endDate: end,
        isPublic: false,
      },
    });
    expect(tripRes.ok(), await tripRes.text()).toBeTruthy();
    const tripBody = await tripRes.json();
    tripId = tripBody.data?._id ?? tripBody.data?.id;
    expect(tripId).toBeTruthy();

    placeId = await seedPlace();
    const stopRes = await page.request.post(`/api/trips/${tripId}/itinerary`, {
      data: { placeId, day: 1 },
    });
    expect(stopRes.ok(), await stopRes.text()).toBeTruthy();

    const checklistRes = await page.request.post(`/api/trips/${tripId}/checklist/bulk`, {
      data: { templateId: 'beach' },
    });
    expect(checklistRes.ok(), await checklistRes.text()).toBeTruthy();
    const checklistBody = await checklistRes.json();
    expect(checklistBody.data?.added).toBeGreaterThan(0);

    await page.goto(`/schedule-reference/${tripId}`);
    await expect(page.getByRole('heading', { name: 'E2E Trip' })).toBeVisible();
    await expect(page.getByText('E2E Test Place').first()).toBeVisible();
  });
});
