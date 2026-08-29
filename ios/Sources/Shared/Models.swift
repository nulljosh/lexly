import Foundation

struct Catalog: Decodable {
    let categories: [String: Category]
}

struct Category: Decodable {
    let title: String
    let subjects: [Subject]
}

struct Subject: Decodable, Identifiable {
    let id: String
    let name: String
    let icon: String
    let level: String
    let packPath: String?
    let notesPath: String?
}

struct Notes: Decodable {
    let id: String
    let name: String
    let sections: [NotesSection]
}

struct NotesSection: Decodable, Identifiable {
    let id: String
    let title: String
    let unitTag: String
    let blocks: [NotesBlock]
}

struct NotesBlock: Decodable, Identifiable {
    let type: String
    let text: String?
    let title: String?
    let items: [String]?
    let ordered: Bool?
    let steps: [String]?
    let headers: [String]?
    let rows: [[String]]?
    let modules: [NotesModule]?
    let cards: [NotesFlashcard]?

    var id: String { (title ?? text ?? UUID().uuidString) + type }
}

struct NotesModule: Decodable, Identifiable {
    let title: String
    let items: [String]
    var id: String { title }
}

struct NotesFlashcard: Decodable, Identifiable {
    let q: String
    let a: String
    var id: String { q }
}

struct CoursePack: Decodable {
    let id: String
    let name: String
    let category: String
    let level: String
    let units: [Unit]
}

struct Unit: Decodable, Identifiable {
    let id: String
    let title: String
    let lessons: [Lesson]
}

struct Lesson: Decodable, Identifiable {
    let id: String
    let title: String
    let exercises: [Exercise]
}

struct Exercise: Decodable, Identifiable {
    let type: String
    let question: String
    let answer: String
    let choices: [String]?
    let id: String
}

struct LingoProfile: Decodable {
    var display_name: String?
    var avatar_id: String?
}

struct LingoProgress: Codable {
    var xp: Int = 0
    var streak: Int = 0
    var completedLessonIds: Set<String> = []
    var lastPlayed: String = ""
}

struct DBProgress: Codable {
    var id: String
    var xp: Int
    var streak: Int
    var hearts: Int
    var completed_subjects: [String]
    var trophy_ids: [String]
    var lessons_completed: [String: Bool]
    var last_played: String?
    var updated_at: String
}
