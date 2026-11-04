import { expect, test } from '@playwright/test';

test('regression: the Home Screen app covers every route and has its own icon', async ({ page, request }) => {
    await page.goto('/login');

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    const res = await request.get(manifestHref!);
    expect(res.ok()).toBe(true);
    const manifest = await res.json();

    // iOS falls back to the page the app was added from as its scope, which put /log etc. outside it
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/dashboard');

    const iconHrefs = [
        await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'),
        ...manifest.icons.map((icon: { src: string }) => icon.src),
    ];
    for (const href of iconHrefs) {
        const icon = await request.get(href!);
        expect(icon.ok(), href!).toBe(true);
        expect(icon.headers()['content-type'], href!).toContain('image/png');
    }
});
