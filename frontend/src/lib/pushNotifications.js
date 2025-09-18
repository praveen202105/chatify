import { axiosInstance } from "./axios";
import toast from "react-hot-toast";

// This is a placeholder for the VAPID public key
// It will be replaced with the actual key from the backend
const VAPID_PUBLIC_KEY = "BOdfaGFzmtQxTKaxSLAHRS3N2WoP9vEPTB1HVERv2bgCV45djP-vfvBqUB2GuCK6wOPkZIOOmU6O2Jm2ht3BjEc";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error("Push notifications are not supported by your browser.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      toast.success("You are already subscribed to notifications.");
      return subscription;
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log("New subscription: ", subscription);

    // Send the subscription to the backend
    try {
      const response = await axiosInstance.post("/auth/save-subscription", { subscription });
      console.log("Subscription saved to backend: ", response.data);
      toast.success("Subscribed to notifications successfully!");
    } catch (error) {
      console.error("Failed to save subscription to backend:", error);
      toast.error("Failed to save subscription to backend.");
    }

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    toast.error("Failed to subscribe to push notifications.");
  }
}
