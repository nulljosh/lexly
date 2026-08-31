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
            .shareApp("https://lexly.heyitsmejosh.com")
        }
        .defaultSize(width: 1100, height: 750)
        .windowResizability(.contentMinSize)
    }
}

// MARK: - Share

// ponytail: one overlay rather than a per-screen toolbar button — these root views share no
// navigation container to hang a .toolbar on. Move it into a toolbar per screen if this ever
// covers something that matters.
private struct AppShareOverlay: ViewModifier {
    let link: String

    func body(content: Content) -> some View {
        content.overlay(alignment: .bottomTrailing) {
            if let url = URL(string: link) {
                ShareLink(item: url) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 15, weight: .medium))
                        .padding(10)
                        .background(.regularMaterial, in: Circle())
                }
                .buttonStyle(.plain)
                .padding(16)
            }
        }
    }
}

private extension View {
    func shareApp(_ link: String) -> some View { modifier(AppShareOverlay(link: link)) }
}
