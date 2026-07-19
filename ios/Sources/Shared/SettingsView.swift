import SwiftUI

struct SettingsView: View {
    var auth: AuthStore

    var body: some View {
        List {
            Section {
                Button("Sign Out", role: .destructive) {
                    Task { try? await auth.signOut() }
                }
            }
        }
        .navigationTitle("Settings")
    }
}
