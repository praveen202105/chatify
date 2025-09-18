self.addEventListener('push', event => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || '/icon.png', // Use sender's avatar if available
    badge: '/badge.png',
    image: data.image, // Show image if it's an image message
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'mark-as-read', title: 'Mark as Read' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  // Handle notification click
  console.log('Notification clicked: ', event);
  event.notification.close();

  // Handle actions
  if (event.action === 'reply') {
    // Open the chat and focus the input
    // This is a complex action and requires more implementation
  } else {
    // Default action: open the app
    clients.openWindow('/');
  }
});
