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

    func testCategoryOrderLeadsWithSchool() throws {
        let url = resourcesDir.appendingPathComponent("catalog.json")
        let catalog = try JSONDecoder().decode(Catalog.self, from: try Data(contentsOf: url))
        XCTAssertEqual(catalog.categoryKeys.first, "school")
        XCTAssertEqual(Set(catalog.categoryKeys), Set(catalog.categories.keys),
                       "every category must appear exactly once in the ordered list")
        XCTAssertEqual(catalog.categoryKeys.count, catalog.categories.count)
    }

    func testCoursePackDecodes() throws {
        let url = resourcesDir.appendingPathComponent("courses/anatomy12.json")
        let data = try Data(contentsOf: url)
        let pack = try JSONDecoder().decode(CoursePack.self, from: data)
        XCTAssertFalse(pack.units.isEmpty)
    }

    func testMasterclassNotesDecode() throws {
        let url = resourcesDir.appendingPathComponent("notes/precalc12_masterclass.json")
        let data = try Data(contentsOf: url)
        let notes = try JSONDecoder().decode(Notes.self, from: data)
        XCTAssertFalse(notes.sections.isEmpty)
    }
}
