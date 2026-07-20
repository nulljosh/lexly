import SwiftUI

struct SettingsView: View {
    var auth: AuthStore
    @State private var confirmingDelete = false
    @State private var deleting = false
    @State private var deleteError: String?

    var body: some View {
        List {
            Section {
                Button("Sign Out", role: .destructive) {
                    Task { try? await auth.signOut() }
                }
            }

            Section {
                Button("Delete Account", role: .destructive) {
                    confirmingDelete = true
                }
                .disabled(deleting)
            } footer: {
                Text("Permanently deletes your account and progress. This cannot be undone.")
            }
        }
        .navigationTitle("Settings")
        .confirmationDialog(
            "Delete your account?",
            isPresented: $confirmingDelete,
            titleVisibility: .visible
        ) {
            Button("Delete Account", role: .destructive) {
                deleting = true
                Task {
                    do {
                        try await auth.deleteAccount()
                    } catch {
                        deleteError = error.localizedDescription
                    }
                    deleting = false
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This permanently deletes your account and progress. This cannot be undone.")
        }
        .alert("Couldn't Delete Account", isPresented: .constant(deleteError != nil), actions: {
            Button("OK") { deleteError = nil }
        }, message: {
            Text(deleteError ?? "")
        })
    }
}
