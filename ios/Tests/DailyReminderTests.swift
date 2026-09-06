import XCTest
@testable import Lingo_iOS

final class DailyReminderTests: XCTestCase {
    private func at(_ y: Int, _ m: Int, _ d: Int, _ h: Int) -> Date {
        Calendar.current.date(from: DateComponents(year: y, month: m, day: d, hour: h))!
    }
    func testBeforeSevenTodayFiresToday() {
        let f = DailyReminder.nextFireDate(from: at(2026, 9, 6, 10), playedToday: false)
        XCTAssertEqual(f, at(2026, 9, 6, 19))
    }
    func testAfterSevenFiresTomorrow() {
        let f = DailyReminder.nextFireDate(from: at(2026, 9, 6, 20), playedToday: false)
        XCTAssertEqual(f, at(2026, 9, 7, 19))
    }
    func testPlayedTodaySkipsToday() {
        let f = DailyReminder.nextFireDate(from: at(2026, 9, 6, 10), playedToday: true)
        XCTAssertEqual(f, at(2026, 9, 7, 19))
    }
}
