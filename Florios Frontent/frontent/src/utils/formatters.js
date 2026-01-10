// Format time like "12:40:12"
export function formatTime(timestamp) {
  if (!timestamp) return "—";
  
  let date;
  // Handle Unix timestamp (number in seconds)
  if (typeof timestamp === 'number') {
    // Convert Unix timestamp (seconds) to Date
    date = new Date(timestamp * 1000);
  }
  // Handle string format "YYYY-MM-DD HH:MM:SS"
  else if (typeof timestamp === 'string') {
    // Convert "2026-01-09 12:40:07" to Date
    date = new Date(timestamp.replace(' ', 'T'));
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date)) return "—";
  
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${hours}:${minutes}:${seconds}`;
}

// Format rate display
export function formatRate(infusionRate) {
  if (!infusionRate || infusionRate <= 0 || Math.abs(infusionRate) < 0.01) {
    return "--";
  }
  // Backend sends rate in ml/min, so no conversion needed
  return Math.abs(infusionRate).toFixed(1);
}

// Format time remaining
export function formatTimeRemaining(timeRemaining, remainingVolume, infusionRate) {
  // If time_remaining is valid and positive (in seconds)
  if (timeRemaining && timeRemaining > 0) {
    const minutes = Math.floor(timeRemaining / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
  
  // Calculate from remaining volume and rate
  if (infusionRate && infusionRate > 0 && remainingVolume > 0) {
    // infusionRate is in ml/min, remainingVolume is in ml
    const minutes = remainingVolume / infusionRate;
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${Math.floor(minutes % 60)}m`;
    }
    if (minutes > 0) {
      return `${Math.floor(minutes)}m`;
    }
    return "< 1m";
  }
  
  return "--";
}

// Get gradient color based on percentage (green to red)
// Green (#22c55e = rgb(34, 197, 94)) at 100%
// Yellow (#eab308 = rgb(234, 180, 8)) at 50%
// Red (#ef4444 = rgb(239, 68, 68)) at 0%
export function getProgressBarColor(percentage) {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  if (clampedPercentage >= 50) {
    // Green to yellow (50-100%)
    const ratio = (clampedPercentage - 50) / 50; // 0 to 1 as we go from 50% to 100%
    // Interpolate from green to yellow
    const r = Math.round(34 + (234 - 34) * (1 - ratio));
    const g = Math.round(197 + (180 - 197) * (1 - ratio));
    const b = Math.round(94 + (8 - 94) * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to red (0-50%)
    const ratio = clampedPercentage / 50; // 0 to 1 as we go from 0% to 50%
    // Interpolate from yellow to red
    const r = Math.round(234 + (239 - 234) * (1 - ratio));
    const g = Math.round(180 + (68 - 180) * (1 - ratio));
    const b = Math.round(8 + (68 - 8) * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
