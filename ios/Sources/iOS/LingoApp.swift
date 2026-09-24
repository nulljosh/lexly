import SwiftUI

@main
struct LingoApp: App {
    @State private var auth = AuthStore()
    @State private var store = ContentStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isLoading {
                    SplashView()
                } else {
                    RootTabView(store: store, auth: auth)
                }
            }
            .tint(Color(hex: "5B9BD5"))
            .overlay { WhatsNewSheet() }
            .onChange(of: scenePhase) { _, phase in
                guard phase == .active else { return }
                Task { await DailyReminder.reschedule(playedToday: store.playedToday) }
            }
        }
    }
}
