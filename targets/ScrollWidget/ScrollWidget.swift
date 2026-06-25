import WidgetKit
import SwiftUI

private let appGroupIdentifier = "group.com.scroll.app.blocker"
private let widgetDataKey = "scroll.widget.summary.v1"

struct ScrollWidgetSummary: Decodable {
  let lockedCount: Int
  let lockedAppNames: [String]
  let totalTracked: Int
  let activeLockApp: String?
  let lockEndsAt: String?
  let updatedAt: String

  static let empty = ScrollWidgetSummary(
    lockedCount: 0,
    lockedAppNames: [],
    totalTracked: 0,
    activeLockApp: nil,
    lockEndsAt: nil,
    updatedAt: ""
  )
}

struct ScrollWidgetEntry: TimelineEntry {
  let date: Date
  let summary: ScrollWidgetSummary
  let lockEndDate: Date?
}

private func parseISODate(_ value: String) -> Date? {
  let withFraction = ISO8601DateFormatter()
  withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  if let date = withFraction.date(from: value) { return date }

  let withoutFraction = ISO8601DateFormatter()
  withoutFraction.formatOptions = [.withInternetDateTime]
  return withoutFraction.date(from: value)
}

struct ScrollWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> ScrollWidgetEntry {
    ScrollWidgetEntry(date: Date(), summary: .empty, lockEndDate: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (ScrollWidgetEntry) -> Void) {
    completion(loadEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ScrollWidgetEntry>) -> Void) {
    let entry = loadEntry()
    let nextRefresh = Date().addingTimeInterval(15 * 60)
    completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
  }

  private func loadEntry() -> ScrollWidgetEntry {
    guard
      let defaults = UserDefaults(suiteName: appGroupIdentifier),
      let raw = defaults.string(forKey: widgetDataKey),
      let data = raw.data(using: .utf8),
      let summary = try? JSONDecoder().decode(ScrollWidgetSummary.self, from: data)
    else {
      return ScrollWidgetEntry(date: Date(), summary: .empty, lockEndDate: nil)
    }

    let lockEndDate = summary.lockEndsAt.flatMap(parseISODate)
    return ScrollWidgetEntry(date: Date(), summary: summary, lockEndDate: lockEndDate)
  }
}

private let backgroundColor = Color(red: 0.067, green: 0.075, blue: 0.110)
private let mutedColor = Color(red: 0.565, green: 0.596, blue: 0.71)
private let textColor = Color.white
private let lockColor = Color(red: 1.0, green: 0.42, blue: 0.42)
private let freeColor = Color(red: 0.486, green: 0.424, blue: 1.0)

struct ScrollWidgetEntryView: View {
  var entry: ScrollWidgetEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("SCROLL")
        .font(.system(size: 11, weight: .semibold))
        .foregroundColor(mutedColor)
        .tracking(1.2)

      Spacer(minLength: 4)

      Text(entry.summary.lockedCount == 1 ? "1 app locked" : "\(entry.summary.lockedCount) apps locked")
        .font(.system(size: 17, weight: .bold))
        .foregroundColor(textColor)

      if entry.summary.lockedCount > 0, let appName = entry.summary.activeLockApp {
        Text(appName)
          .font(.system(size: 12))
          .foregroundColor(mutedColor)
          .lineLimit(1)
      }

      Spacer(minLength: 4)

      if entry.summary.lockedCount > 0, let endDate = entry.lockEndDate {
        Text("Unlocks in \(Text(endDate, style: .timer))")
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(lockColor)
          .lineLimit(1)
      } else {
        Text("All within limits")
          .font(.system(size: 14, weight: .semibold))
          .foregroundColor(freeColor)
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .background(backgroundColor)
  }
}

struct ScrollWidget: Widget {
  let kind: String = "ScrollWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: ScrollWidgetProvider()) { entry in
      ScrollWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("SCROLL")
    .description("Shows how many apps are locked and when they unlock.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct ScrollWidgetBundle: WidgetBundle {
  var body: some Widget {
    ScrollWidget()
  }
}
