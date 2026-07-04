import SwiftUI
import WidgetKit

struct LingoWidgetEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let xp: Int
}

struct LingoWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> LingoWidgetEntry {
        LingoWidgetEntry(date: Date(), streak: 0, xp: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (LingoWidgetEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LingoWidgetEntry>) -> Void) {
        let entry = loadEntry()
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func loadEntry() -> LingoWidgetEntry {
        let defaults = UserDefaults(suiteName: "group.com.nulljosh.lingo")
        return LingoWidgetEntry(
            date: Date(),
            streak: defaults?.integer(forKey: "widget.streak") ?? 0,
            xp: defaults?.integer(forKey: "widget.xp") ?? 0
        )
    }
}

struct LingoWidgetView: View {
    var entry: LingoWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Streak")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("\(entry.streak) day\(entry.streak == 1 ? "" : "s")")
                .font(.system(size: 30, weight: .bold, design: .rounded))
            Text("\(entry.xp) XP")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
    }
}

struct LingoWidget: Widget {
    let kind: String = "LingoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LingoWidgetProvider()) { entry in
            LingoWidgetView(entry: entry)
        }
        .configurationDisplayName("Lexly Streak")
        .description("See your current streak and XP.")
        .supportedFamilies([.systemSmall])
    }
}
