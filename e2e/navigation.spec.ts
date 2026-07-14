import { expect, test } from '@playwright/test';

test.describe('Điều hướng nội dung du lịch', () => {
  test('tin tức mở danh sách tham khảo và khám phá mở trang địa điểm theo chủ đề', async ({ page }) => {
    await page.goto('/local/ha-noi');

    await page.locator('#local-news-hoi-an-short-trip').click();
    await expect(page).toHaveURL(/\/travel-references\/hoi-an-short-trip$/);
    await expect(page.getByRole('heading', { name: 'Điểm đến nổi bật' })).toBeVisible();
    await expect(page.locator('#reference-destination-list article')).toHaveCount(5);

    await page.goto('/local/ha-noi');
    await page.locator('#local-discovery-places-van-hoa').click();
    await expect(page).toHaveURL(/\/local\/ha-noi\/places\?theme=van-hoa$/);
  });

  test('thẻ điểm đến mở trang chi tiết và giữ nguyên hành động lập lịch', async ({ page }) => {
    const destinationId = 'ha-noi-lang-chu-tich-ho-chi-minh';
    const destinationName = 'Lăng Chủ tịch Hồ Chí Minh';
    const plannerHref = `/?q=${encodeURIComponent(destinationName)}&select=1#planner`;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/travel-references/cu-da-cultural-village');

    const detailLink = page.locator(`#view-destination-${destinationId}`);
    const plannerLink = page.locator(`#plan-reference-${destinationId}`);
    await expect(detailLink).toHaveAttribute('href', `/destinations/${destinationId}`);
    await expect(plannerLink).toHaveAttribute('href', plannerHref);
    await expect(detailLink).toHaveAttribute('aria-label', `Xem chi tiết ${destinationName}`);

    await detailLink.click();

    await expect(page).toHaveURL(new RegExp(`/destinations/${destinationId}$`));
    await expect(page.getByRole('heading', { level: 1, name: destinationName })).toBeVisible();
    await expect(page.locator(`#plan-destination-${destinationId}`)).toHaveAttribute('href', plannerHref);
    await expect(page.getByRole('heading', { name: `Khám phá ${destinationName} theo nhịp riêng` })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chuẩn bị gọn, trải nghiệm chủ động' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Đặc trưng của điểm đến' })).toHaveCount(0);
    await expect(page.getByText('Những nét đặc sắc thu hút du khách', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Đánh giá gợi ý', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('img', { name: destinationName })).toHaveCount(1);

    const layout = await page.evaluate(() => ({
      fontFamily: window.getComputedStyle(document.body).fontFamily,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    }));
    expect(layout.fontFamily).toContain('Be Vietnam Pro');
    expect(layout.hasHorizontalOverflow).toBe(false);
  });
});
