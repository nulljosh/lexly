import SwiftUI

@main
struct LingoApp: App {
    @State private var auth = AuthStore()
    @State private var store = ContentStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isLoading {
                    SplashView()
                } else {
                    CatalogView(store: store, auth: auth)
                }
            }
            .tint(Color(hex: "5B9BD5"))
            // App Review 2.1(a), 2026-08-24: the window launched collapsed to a
            // ~80x160 sliver. Cause was minWidth/minHeight 0 outside the
            // -screenshots flag combined with .contentSize, which sizes the
            // window to the content's intrinsic size. Always give a real
            // minimum, and let the content grow past it.
            .frame(minWidth: CommandLine.arguments.contains("-screenshots") ? 1280 : 900, minHeight: CommandLine.arguments.contains("-screenshots") ? 800 : 600)
        }
        .defaultSize(width: 1100, height: 750)
        .windowResizability(.contentMinSize)
    }
}
