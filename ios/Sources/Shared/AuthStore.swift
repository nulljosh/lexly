import Foundation
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://tjsxsqlxjmanwvmywwvw.supabase.co")!,
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc3hzcWx4am1hbnd2bXl3d3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTc0MDEsImV4cCI6MjA4NjA3MzQwMX0.LphLfho3wdQC20MhtcnBpzQUNuBoTOobrugQbNGxc68"
)

@Observable
final class AuthStore {
    var session: Session?
    var isLoading = true
    // ponytail: App Store screenshot automation needs to skip the real auth
    // gate (demo Supabase credentials expire/rotate independently of this repo)
    private let mockSignedIn = CommandLine.arguments.contains("UITEST_SNAPSHOT")

    init() {
        if mockSignedIn {
            isLoading = false
            return
        }
        Task { await refresh() }
    }

    var isSignedIn: Bool { mockSignedIn || session != nil }

    func refresh() async {
        session = try? await supabase.auth.session
        isLoading = false
    }

    func signUp(email: String, password: String, displayName: String, avatarId: String) async throws {
        let result = try await supabase.auth.signUp(email: email, password: password)
        session = try? await supabase.auth.session
        let uid = result.user.id.uuidString
        try await supabase.from("lingo_profiles")
            .upsert(["id": AnyJSON.string(uid), "display_name": AnyJSON.string(displayName), "avatar_id": AnyJSON.string(avatarId)])
            .execute()
        try await supabase.from("lingo_progress")
            .upsert(["id": AnyJSON.string(uid), "xp": AnyJSON.integer(0), "streak": AnyJSON.integer(0), "hearts": AnyJSON.integer(5),
                     "completed_subjects": AnyJSON.array([]), "lessons_completed": AnyJSON.object([:]),
                     "trophy_ids": AnyJSON.array([]), "srs": AnyJSON.object([:])])
            .execute()
    }

    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(email: email, password: password)
        session = try? await supabase.auth.session
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
        session = nil
    }
}
