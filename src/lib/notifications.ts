import * as Notifications from 'expo-notifications';

/**
 * A gentle, once-a-month local reminder to tidy up the photo library. It fires at a random day
 * and (daytime) hour within roughly the next month. There's no server — when the notification
 * fires it leaves the schedule, and the next time the app opens we schedule the following one,
 * giving a "random time each month" cadence without any background work.
 */
const REMINDER_ID = 'monthly-cleanup-reminder';

const MESSAGES = [
  'Do you have a moment to clean up your gallery?',
  'Got a minute to sweep through your photos?',
  'Time for a quick tidy of your camera roll?',
  'A few swipes can free up some space — fancy a clean-up?',
];

// Show the alert even if the app happens to be in the foreground when it fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function randomFireDate(): Date {
  const d = new Date();
  // 12–35 days out → always somewhere within the coming month, never immediately.
  d.setDate(d.getDate() + 12 + Math.floor(Math.random() * 24));
  // A sensible daytime hour (09:00–20:59) so it never buzzes in the middle of the night.
  d.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

/**
 * Ensures a future cleanup reminder is scheduled. Safe to call on every app launch: if one is
 * already pending it does nothing; otherwise (first run, or the last one already fired) it
 * schedules the next one at a fresh random time. Quietly no-ops if permission is denied.
 */
export async function ensureCleanupReminder(): Promise<void> {
  try {
    let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (!granted && canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.some((n) => n.identifier === REMINDER_ID)) return; // already pending

    const date = randomFireDate();
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: 'Time for a quick tidy? 🧹',
        body: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    // Notifications are a nice-to-have — never let a scheduling hiccup affect app startup.
  }
}
