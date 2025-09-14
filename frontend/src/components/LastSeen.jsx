import { useState, useEffect } from "react";

const LastSeen = ({ lastSeen, isOnline, className = "" }) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (!lastSeen) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const lastSeenDate = new Date(lastSeen);
      const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);

      if (isOnline) {
        setTimeAgo("online");
        return;
      }

      if (diffInSeconds < 60) {
        setTimeAgo("just now");
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeAgo(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        setTimeAgo(`${days} day${days > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        setTimeAgo(`${weeks} week${weeks > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        setTimeAgo(`${months} month${months > 1 ? 's' : ''} ago`);
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        setTimeAgo(`${years} year${years > 1 ? 's' : ''} ago`);
      }
    };

    updateTimeAgo();

    // Update every minute
    const interval = setInterval(updateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [lastSeen, isOnline]);

  if (!timeAgo) return null;

  return (
    <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-slate-400'} ${className}`}>
      {isOnline ? 'Online' : `Last seen ${timeAgo}`}
    </span>
  );
};

export default LastSeen;