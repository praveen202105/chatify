self.addEventListener('push', event => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon.png', // You can add an icon file
    badge: '/badge.png' // And a badge
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
