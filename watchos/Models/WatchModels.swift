import Foundation

/// SM-2 card, field-for-field the shape the web app writes to `lingo_progress.srs`
/// (see `updateSrs` in js/lingo-app.js), so this matches iOS `Sources/Shared/Models.swift`.
struct SrsCard: Codable {
    var easiness: Double = 2.5
    var interval: Int = 1
    var repetitions: Int = 0
    var nextReview: String = ""
}

/// Field-for-field the `lingo_progress` table row, matching iOS's `DBProgress`
/// (`Sources/Shared/Models.swift`). Column names are already snake_case so no
/// CodingKeys are needed.
struct DBProgress: Codable {
    var id: String
    var xp: Int
    var streak: Int
    var hearts: Int
    var completed_subjects: [String]?
    var trophy_ids: [String]?
    var lessons_completed: [String: Bool]?
    var last_played: String?
    var srs: [String: SrsCard]?
    var updated_at: String?

    /// Cards whose `nextReview` has passed, mirroring the WebMCP `get_due_reviews`
    /// tool and `updateSrs`'s own due check in js/lingo-app.js.
    var dueReviewCount: Int {
        guard let srs else { return 0 }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        let now = Date()
        return srs.values.filter { card in
            let due = formatter.date(from: card.nextReview) ?? fallback.date(from: card.nextReview)
            guard let due else { return false }
            return due <= now
        }.count
    }
}
