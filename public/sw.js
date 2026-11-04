// Service worker for reminder notifications. Pages show them with registration.showNotification
// (the way that works on Android Chrome); this file only handles the click: navigate an open app
// window to the notification's URL and focus it, or open one.

// Take control of open pages right away: a page that is not controlled cannot be navigated from here
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = new URL(event.notification.data?.url ?? '/dashboard', self.location.origin).href;
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
            const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
            if (open) {
                try {
                    const navigated = await open.navigate(url);
                    return (navigated ?? open).focus();
                } catch {
                    // Not controlled by this worker yet: open the page instead
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
