import SwiftUI

@main
struct LingoApp: App {
    @State private var auth = AuthStore()
    @State private var store = ContentStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isLoading {
                    ProgressView()
                } else {
                    CatalogView(store: store, auth: auth)
                }
            }
            .tint(Color(hex: "5B9BD5"))
            .overlay { WhatsNewSheet() }
        }
    }
}
