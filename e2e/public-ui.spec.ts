import { expect, test } from '@playwright/test';

test.describe('Giao diện công khai', () => {
  test('đường dẫn quản trị cũ mở đúng trang, dùng đúng font và chỉ một viền focus', async ({ page }) => {
    await page.goto('/login/admin');

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();

    const password = page.locator('#admin-password');
    await password.focus();
    await expect(password).toBeFocused();

    await expect.poll(() => password.evaluate((element) => {
      const fieldStyle = getComputedStyle(element);
      const bodyStyle = getComputedStyle(document.body);
      return {
        fontFamily: bodyStyle.fontFamily,
        borderWidth: fieldStyle.borderWidth,
        outlineWidth: fieldStyle.outlineWidth,
        outlineOffset: fieldStyle.outlineOffset,
        ringShadow: fieldStyle.getPropertyValue('--tw-ring-shadow').trim(),
      };
    })).toEqual({
      fontFamily: expect.stringContaining('Be Vietnam Pro'),
      borderWidth: '1px',
      outlineWidth: '2px',
      outlineOffset: '-2px',
      ringShadow: '0 0 #0000',
    });
  });

  test('menu mobile hiển thị đủ điều hướng và không làm tràn trang', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const menuButton = page.locator('#header-mobile-menu-button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator('#mobile-nav-local')).toBeVisible();
    await expect(page.locator('#mobile-nav-hotels')).toBeVisible();
    await expect(page.locator('#mobile-nav-flights')).toBeVisible();
    await expect(page.locator('#mobile-nav-news')).toBeVisible();

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      fontFamily: getComputedStyle(document.body).fontFamily,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(layout.fontFamily).toContain('Be Vietnam Pro');

    await page.locator('#mobile-nav-flights').click();
    await expect(page).toHaveURL(/\/flights$/);
  });

  test('chặng bay từ trang hãng được giữ nguyên trong form tìm kiếm', async ({ page }) => {
    await page.goto('/flights/airlines/vn');
    await page.locator('#airline-route-han-sgn').click();

    await expect(page).toHaveURL(/\/flights\?from=HAN&to=SGN$/);
    await expect(page.locator('#flight-origin')).toHaveValue('HAN');
    await expect(page.locator('#flight-destination')).toHaveValue('SGN');
  });

  test('các trường tìm chuyến bay chỉ hiển thị một đường focus', async ({ page }) => {
    await page.goto('/flights');
    await page.locator('#flight-round-trip').check();

    const fieldIds = [
      'flight-origin',
      'flight-destination',
      'flight-passenger-count',
      'flight-depart-date',
      'flight-return-date',
    ];

    for (const fieldId of fieldIds) {
      const field = page.locator(`#${fieldId}`);
      await field.focus();
      await expect(field).toBeFocused();
      await expect.poll(() => field.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineOffset: style.outlineOffset,
        };
      })).toEqual({
        outlineStyle: 'solid',
        outlineWidth: '2px',
        outlineOffset: '-2px',
      });
    }
  });

  test('ô chọn địa điểm dùng cùng một đường focus với các form control', async ({ page }) => {
    await page.goto('/');

    const field = page.locator('#destination-search-input');
    await field.focus();
    await expect(field).toBeFocused();
    await expect.poll(() => field.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        borderRadius: Number.parseFloat(style.borderRadius),
      };
    })).toEqual({
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '-2px',
      borderRadius: 16,
    });
  });

  test('các field ngày và số người đưa focus lên wrapper bo tròn', async ({ page }) => {
    await page.goto('/');

    const compositeFields = [
      ['trip-start-date', 'trip-start-date-control'],
      ['trip-end-date', 'trip-end-date-control'],
      ['trip-traveler-count', 'trip-traveler-count-control'],
    ] as const;

    for (const [inputId, controlId] of compositeFields) {
      const input = page.locator(`#${inputId}`);
      const control = page.locator(`#${controlId}`);
      await input.focus();
      await expect(input).toBeFocused();

      expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none');
      await expect.poll(() => control.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineOffset: style.outlineOffset,
          hasRadius: Number.parseFloat(style.borderRadius) > 0,
        };
      })).toEqual({
        outlineStyle: 'solid',
        outlineWidth: '2px',
        outlineOffset: '-2px',
        hasRadius: true,
      });
    }
  });

  test('field đăng nhập dùng border thật và một đường focus inset', async ({ page }) => {
    await page.goto('/');
    await page.locator('#header-auth-login-button').click();

    const email = page.locator('input[type="email"]:visible').first();
    await email.focus();
    await expect(email).toBeFocused();
    await expect.poll(() => email.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderStyle: style.borderStyle,
        borderWidth: style.borderWidth,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
      };
    })).toEqual({
      borderStyle: 'solid',
      borderWidth: '1px',
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '-2px',
    });
  });

  test('focus ô tìm kiếm địa phương bám theo khung bo tròn', async ({ page }) => {
    await page.goto('/local');

    const form = page.locator('#locality-search-form');
    const input = page.locator('#locality-search-input');
    const submit = page.locator('#locality-search-submit');

    await input.focus();
    await expect(input).toBeFocused();

    const inputFocus = await input.evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle };
    });
    const formFocus = await form.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        borderRadius: Number.parseFloat(style.borderRadius),
      };
    });

    expect(inputFocus.outlineStyle).toBe('none');
    expect(formFocus.outlineStyle).toBe('solid');
    expect(formFocus.outlineWidth).toBe('2px');
    expect(formFocus.outlineOffset).toBe('-2px');
    expect(formFocus.borderRadius).toBeGreaterThan(0);

    await submit.focus();
    const submitFocus = await submit.evaluate((element) => getComputedStyle(element).outlineStyle);
    const formAfterSubmitFocus = await form.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(submitFocus).toBe('solid');
    expect(formAfterSubmitFocus).toBe('none');
  });

  test('icon của mọi dropdown chuyến bay dùng cùng kích thước và khoảng đệm', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/flights');

    const selects = page.locator('select.app-select');
    await expect(selects).toHaveCount(3);

    for (let index = 0; index < await selects.count(); index += 1) {
      const select = selects.nth(index);
      const metrics = await select.evaluate((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          appearance: style.appearance,
          backgroundImage: style.backgroundImage,
          backgroundPosition: style.backgroundPosition,
          backgroundSize: style.backgroundSize,
          paddingRight: style.paddingRight,
          insideViewport: rect.left >= 0 && rect.right <= document.documentElement.clientWidth,
        };
      });

      expect(metrics.appearance).toBe('none');
      expect(metrics.backgroundImage).toContain('svg');
      expect(metrics.backgroundPosition).toBe('calc(100% - 14px) 50%');
      expect(metrics.backgroundSize).toBe('16px 16px');
      expect(metrics.paddingRight).toBe('40px');
      expect(metrics.insideViewport).toBe(true);
    }
  });

  test('chevron menu điểm đến luôn nằm giữa và ở trong trigger', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const trigger = page.locator('#desktop-nav-destinations');
    const chevron = trigger.locator('svg.app-dropdown-chevron');
    await expect(trigger).toBeVisible();
    await expect(chevron).toBeVisible();

    const geometry = await trigger.evaluate((element) => {
      const triggerRect = element.getBoundingClientRect();
      const iconRect = element.querySelector('svg.app-dropdown-chevron')?.getBoundingClientRect();
      if (!iconRect) return null;
      return {
        width: iconRect.width,
        height: iconRect.height,
        centerDelta: Math.abs(
          (iconRect.top + iconRect.height / 2) - (triggerRect.top + triggerRect.height / 2),
        ),
        contained:
          iconRect.left >= triggerRect.left
          && iconRect.right <= triggerRect.right
          && iconRect.top >= triggerRect.top
          && iconRect.bottom <= triggerRect.bottom,
      };
    });

    expect(geometry).toEqual({ width: 16, height: 16, centerDelta: 0, contained: true });
  });

  test('tên người dùng dài không đẩy chevron ra ngoài header', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.route('**/api/profile/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 200,
          error: null,
          data: {
            _id: 'dropdown-audit-user',
            id: 'dropdown-audit-user',
            email: 'mot-dia-chi-email-cuc-ky-dai-de-kiem-tra-icon-dropdown@example.com',
            avatarUrl: null,
          },
        }),
      });
    });
    await page.goto('/');

    const trigger = page.locator('#header-user-menu-button');
    const chevron = trigger.locator('svg.app-dropdown-chevron');
    await expect(trigger).toBeVisible();
    await expect(chevron).toBeVisible();

    const geometry = await trigger.evaluate((element) => {
      const triggerRect = element.getBoundingClientRect();
      const iconRect = element.querySelector('svg.app-dropdown-chevron')?.getBoundingClientRect();
      const name = element.querySelector<HTMLElement>('span[title]');
      if (!iconRect || !name) return null;
      return {
        iconWidth: iconRect.width,
        iconHeight: iconRect.height,
        iconContained: iconRect.left >= triggerRect.left && iconRect.right <= triggerRect.right,
        triggerContained: triggerRect.right <= document.documentElement.clientWidth,
        nameIsTruncated: name.scrollWidth > name.clientWidth,
      };
    });

    expect(geometry).toEqual({
      iconWidth: 16,
      iconHeight: 16,
      iconContained: true,
      triggerContained: true,
      nameIsTruncated: true,
    });

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
