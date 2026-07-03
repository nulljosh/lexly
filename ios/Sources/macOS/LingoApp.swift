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
                } else if auth.isSignedIn || CommandLine.arguments.contains("-screenshots") {
                    CatalogView(store: store, auth: auth)
                } else {
                    AuthView(auth: auth)
                }
            }
            .tint(Color(hex: "5B9BD5"))
            .frame(minWidth: CommandLine.arguments.contains("-screenshots") ? 1280 : 0, minHeight: CommandLine.arguments.contains("-screenshots") ? 800 : 0)
        }
        .windowResizability(.contentSize)
    }
}
