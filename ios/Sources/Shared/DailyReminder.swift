import Foundation
import UserNotifications

// ponytail: one local notification, no push backend. Permission is asked after the first
// finished lesson, never on cold launch. Finishing a lesson pushes the next fire to tomorrow,
// so a day with a lesson never gets nagged.
enum DailyReminder {
    static let id = "lexly.daily"
    static let enabledKey = "dailyReminder"
    static let hour = 19

    static var isEnabled: Bool {
        UserDefaults.standard.object(forKey: enabledKey) as? Bool ?? true
    }

    /// Next `hour`:00 strictly after `now` (or after today's if a lesson was done today).
    static func nextFireDate(from now: Date, playedToday: Bool, calendar: Calendar = .current) -> Date {
        var c = calendar.dateComponents([.year, .month, .day], from: now)
        c.hour = hour; c.minute = 0
        var d = calendar.date(from: c) ?? now
        if playedToday || d <= now { d = calendar.date(byAdding: .day, value: 1, to: d) ?? d }
        return d
    }

    /// Called after a lesson finishes. First time through asks for permission.
    static func lessonCompleted() {
        Task {
            let center = UNUserNotificationCenter.current()
            if await center.notificationSettings().authorizationStatus == .notDetermined {
                _ = try? await center.requestAuthorization(options: [.alert, .sound])
            }
            await reschedule(playedToday: true)
        }
    }

    /// Safe to call on every foreground. Replacing a pending request with the same id is cheap.
    static func reschedule(playedToday: Bool, now: Date = Date()) async {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [id])
        guard isEnabled, await center.notificationSettings().authorizationStatus == .authorized else { return }
        let fire = nextFireDate(from: now, playedToday: playedToday)
        let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
        let content = UNMutableNotificationContent()
        content.title = "Keep your streak"
        content.body = "One lesson today keeps it alive."
        content.sound = .default
        let req = UNNotificationRequest(identifier: id, content: content, trigger: UNCalendarNotificationTrigger(dateMatching: comps, repeats: false))
        try? await center.add(req)
    }
}
