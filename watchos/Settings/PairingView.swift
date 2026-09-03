import SwiftUI

/// Fills the gap talli's watch app has: WatchAPI reads an apiToken from UserDefaults but
/// there's no UI on the watch to set one. Here the "token" is a Supabase access token
/// copied from the phone (Lexly has no API token of its own -- see WatchAPI.swift).
struct PairingView: View {
    @State private var token: String = WatchAPI.shared.apiToken
    @State private var saved = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text("Pair with Lexly")
                    .font(.headline)

                Text("Paste your Lexly account's access token to sync your streak, XP, and reviews here.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                SecureField("Access token", text: $token)
                    .textContentType(.password)

                Button(saved ? "Saved" : "Save") {
                    WatchAPI.shared.apiToken = token.trimmingCharacters(in: .whitespacesAndNewlines)
                    saved = true
                }
                .disabled(token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                if WatchAPI.shared.isPaired {
                    Button("Unpair", role: .destructive) {
                        token = ""
                        WatchAPI.shared.apiToken = ""
                        saved = false
                    }
                }
            }
            .padding(.horizontal, 4)
        }
        .onChange(of: token) { saved = false }
    }
}
