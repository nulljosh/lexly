import SwiftUI

struct StreakView: View {
    @State private var progress: DBProgress?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                if let progress {
                    Text("\(progress.streak)")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                    Text("day streak")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 10) {
                        stat(value: "\(progress.xp)", label: "XP")
                        stat(value: "\(progress.hearts)", label: "hearts")
                    }
                    .padding(.top, 2)

                    if progress.dueReviewCount > 0 {
                        Text("\(progress.dueReviewCount) reviews due")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                            .padding(.top, 4)
                    } else {
                        Text("All caught up")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .padding(.top, 4)
                    }
                } else if isLoading {
                    ProgressView()
                } else if let errorMessage {
                    Text(errorMessage)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                } else {
                    Text("Not paired")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 4)
        }
        .task { await load() }
        .refreshable { await load(forceNetwork: true) }
    }

    private func stat(value: String, label: String) -> some View {
        VStack(spacing: 0) {
            Text(value)
                .font(.headline)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(minWidth: 40)
    }

    private func load(forceNetwork: Bool = false) async {
        if !forceNetwork, let cached = WatchAPI.shared.cachedProgress() {
            progress = cached
        }
        guard WatchAPI.shared.isPaired else {
            errorMessage = "Pair with Lexly on the Settings tab"
            return
        }
        isLoading = progress == nil
        do {
            progress = try await WatchAPI.shared.fetchProgress()
            errorMessage = nil
        } catch {
            if progress == nil {
                errorMessage = "Couldn't reach Lexly"
            }
        }
        isLoading = false
    }
}
