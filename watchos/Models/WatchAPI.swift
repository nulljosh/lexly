import Foundation

/// Talks directly to the shared `spark` Supabase project's REST API, the same backend
/// `AuthStore.swift` and `js/lingo-app.js` use for `lingo_progress`. There is no Lexly
/// REST API of its own (see `docs/API.md`) and the watch has no room for a real sign-in
/// flow, so the token pasted in PairingView is the Supabase session access token copied
/// from the phone -- the same "paste a token" shape talli's watch app uses.
final class WatchAPI: @unchecked Sendable {
    static let shared = WatchAPI()

    private let baseURL = "https://tjsxsqlxjmanwvmywwvw.supabase.co"
    // Public anon key, already embedded in the web app and iOS AuthStore.swift.
    private let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc3hzcWx4am1hbnd2bXl3d3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTc0MDEsImV4cCI6MjA4NjA3MzQwMX0.LphLfho3wdQC20MhtcnBpzQUNuBoTOobrugQbNGxc68"
    private let session: URLSession
    private let decoder = JSONDecoder()
    private let defaults = UserDefaults.standard

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 15
        session = URLSession(configuration: config)
    }

    var apiToken: String {
        get { defaults.string(forKey: "api_token") ?? "" }
        set { defaults.set(newValue, forKey: "api_token") }
    }

    var isPaired: Bool { !apiToken.isEmpty }

    func fetchProgress() async throws -> DBProgress {
        guard let uid = Self.userId(fromJWT: apiToken) else {
            throw URLError(.userAuthenticationRequired)
        }
        guard var components = URLComponents(string: baseURL + "/rest/v1/lingo_progress") else {
            throw URLError(.badURL)
        }
        components.queryItems = [
            URLQueryItem(name: "id", value: "eq.\(uid)"),
            URLQueryItem(name: "select", value: "*"),
            URLQueryItem(name: "limit", value: "1")
        ]
        guard let url = components.url else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(apiToken)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw URLError(.badServerResponse)
        }
        let rows = try decoder.decode([DBProgress].self, from: data)
        guard let progress = rows.first else {
            throw URLError(.zeroByteResource)
        }
        cache(data)
        return progress
    }

    func cachedProgress() -> DBProgress? {
        guard let data = defaults.data(forKey: "cache_progress") else { return nil }
        return try? decoder.decode([DBProgress].self, from: data).first
    }

    private func cache(_ data: Data) {
        defaults.set(data, forKey: "cache_progress")
        defaults.set(Date().timeIntervalSince1970, forKey: "cache_progress_time")
    }

    /// Pulls the `sub` claim (the Supabase user id) out of the pasted JWT so requests can
    /// filter `lingo_progress` by row owner without a full sign-in flow on the watch.
    private static func userId(fromJWT token: String) -> String? {
        let parts = token.split(separator: ".")
        guard parts.count == 3 else { return nil }
        var base64 = String(parts[1])
        base64 = base64.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while base64.count % 4 != 0 { base64.append("=") }
        guard let data = Data(base64Encoded: base64),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let sub = json["sub"] as? String else {
            return nil
        }
        return sub
    }
}
