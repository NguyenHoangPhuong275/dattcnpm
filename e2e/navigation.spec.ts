import { expect, test } from '@playwright/test';

test.describe('Điều hướng nội dung du lịch', () => {
  test('tin tức mở danh sách tham khảo và khám phá điền điểm đến vào planner', async ({ page }) => {
    await page.goto('/local/ha-noi');

    await page.locator('#local-news-hoi-an-short-trip').click();
    await expect(page).toHaveURL(/\/travel-references\/hoi-an-short-trip$/);
    await expect(page.getByRole('heading', { name: 'Danh sách địa điểm tham khảo' })).toBeVisible();
    await expect(page.locator('#reference-destination-list article')).toHaveCount(5);

    await page.goto('/local/ha-noi');
    await page.locator('#local-discovery-1').click();
    await expect(page).toHaveURL(/\?q=Hu%E1%BA%BF#planner$/);
    await expect(page.locator('#destination-search-input')).toHaveValue('Huế');
  });
});
