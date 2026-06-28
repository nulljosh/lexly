import SwiftUI

@main
struct LingoApp: App {
    @State private var store = ContentStore()

    var body: some Scene {
        WindowGroup {
            CatalogView(store: store)
                .tint(Color(hex: "5B9BD5"))
        }
        .windowResizability(.contentSize)
    }
}
