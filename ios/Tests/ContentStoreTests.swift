import XCTest
@testable import Lingo_iOS

final class ContentStoreTests: XCTestCase {
    // ponytail: decode straight from the repo's content/ dir instead of wiring a test-bundle
    // resource copy — keeps the test target trivial since there's only one consumer.
    private var resourcesDir: URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent() // Tests/
            .deletingLastPathComponent() // ios/
            .appendingPathComponent("Sources/Resources/content")
    }

    func testCatalogDecodes() throws {
        let url = resourcesDir.appendingPathComponent("catalog.json")
        let data = try Data(contentsOf: url)
        let catalog = try JSONDecoder().decode(Catalog.self, from: data)
        XCTAssertFalse(catalog.categories.isEmpty)
        XCTAssertNotNil(catalog.categories["school"], "expected a school category")
    }

    func testCoursePackDecodes() throws {
        let url = resourcesDir.appendingPathComponent("courses/anatomy12.json")
        let data = try Data(contentsOf: url)
        let pack = try JSONDecoder().decode(CoursePack.self, from: data)
        XCTAssertFalse(pack.units.isEmpty)
    }

    // Regression: the Swift Exercise model used to omit `words` and `audio`, so word-bank
    // exercises decoded with no bank and listening exercises with no audio to play.
    func testExerciseKeepsWordBankAndAudio() throws {
        let url = resourcesDir.appendingPathComponent("courses/spanish.json")
        let pack = try JSONDecoder().decode(CoursePack.self, from: try Data(contentsOf: url))
        let exercises = pack.units.flatMap { $0.lessons.flatMap(\.exercises) }

        let sentence = try XCTUnwrap(exercises.first { $0.type == "sentence" })
        XCTAssertFalse(sentence.words?.isEmpty ?? true, "sentence exercise decoded without a word bank")

        let listening = try XCTUnwrap(exercises.first { $0.type == "listening" })
        XCTAssertFalse(listening.audio?.isEmpty ?? true, "listening exercise decoded without audio")

        let match = try XCTUnwrap(exercises.first { $0.type == "match" })
        XCTAssertEqual(match.pairs?.first?.count, 2)

        XCTAssertEqual(pack.lang, "es-ES", "pack language is needed to pick a TTS voice")
    }

    func testMasterclassNotesDecode() throws {
        let url = resourcesDir.appendingPathComponent("notes/precalc12_masterclass.json")
        let data = try Data(contentsOf: url)
        let notes = try JSONDecoder().decode(Notes.self, from: data)
        XCTAssertFalse(notes.sections.isEmpty)
    }
}
