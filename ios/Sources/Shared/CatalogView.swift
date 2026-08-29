import SwiftUI

struct CatalogView: View {
    var store: ContentStore
    var auth: AuthStore
    #if os(macOS)
    @State private var showingSettings = false
    #endif

    var body: some View {
        NavigationStack {
            List {
                if let catalog = store.catalog {
                    ForEach(Array(catalog.categories.keys.sorted()), id: \.self) { key in
                        let category = catalog.categories[key]!
                        Section(category.title) {
                            ForEach(category.subjects) { subject in
                                NavigationLink {
                                    if subject.notesPath != nil {
                                        NotesView(store: store, subject: subject)
                                    } else {
                                        UnitsView(store: store, subject: subject)
                                    }
                                } label: {
                                    SubjectRow(subject: subject)
                                }
                            }
                        }
                    }
                } else {
                    Text("Couldn't load catalog.")
                }
            }
            .navigationTitle("Lexly")
            #if os(macOS)
            .listStyle(.inset)
            // ponytail: Mac had no Settings surface at all, so sign-in was unreachable
            // there. One toolbar button reuses the same SettingsView as iOS.
            .toolbar {
                Button {
                    showingSettings = true
                } label: {
                    Label("Settings", systemImage: "gearshape")
                }
                .accessibilityIdentifier("settingsButton")
            }
            .sheet(isPresented: $showingSettings) {
                NavigationStack {
                    SettingsView(auth: auth, store: store)
                        .toolbar {
                            Button("Done") { showingSettings = false }
                        }
                }
                .frame(minWidth: 420, minHeight: 480)
            }
            #endif
        }
    }
}

/// Bottom tab bar wrapping Catalog + Settings — iOS only (macOS keeps CatalogView's
/// own window, no tab-bar idiom there).
struct RootTabView: View {
    var store: ContentStore
    var auth: AuthStore

    var body: some View {
        TabView {
            CatalogView(store: store, auth: auth)
                .tabItem { Label("Learn", systemImage: "book.fill") }
            NavigationStack {
                SettingsView(auth: auth, store: store)
            }
            .tabItem { Label("Settings", systemImage: "gearshape") }
        }
    }
}

private struct SubjectRow: View {
    let subject: Subject

    // ponytail: Mac rows carry their own metrics — the iOS sizes read cramped and
    // touch-targeted in a desktop window. Tune here, not by forking the whole view.
    #if os(macOS)
    private static let iconSize: CGFloat = 26
    private static let iconTextGap: CGFloat = 10
    private static let rowPadding: CGFloat = 7
    private static let titleFont: Font = .system(size: 13, weight: .medium)
    private static let subtitleFont: Font = .system(size: 11)
    #else
    private static let iconSize: CGFloat = 32
    private static let iconTextGap: CGFloat = 12
    private static let rowPadding: CGFloat = 2
    private static let titleFont: Font = .body.weight(.medium)
    private static let subtitleFont: Font = .caption
    #endif

    var body: some View {
        HStack(spacing: Self.iconTextGap) {
            icon
            VStack(alignment: .leading, spacing: 2) {
                Text(subject.name)
                    .font(Self.titleFont)
                Text(subject.level.capitalized)
                    .font(Self.subtitleFont)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, Self.rowPadding)
    }

    private var icon: some View {
        Image(systemName: sfSymbol(for: subject.icon))
            .font(.system(size: Self.iconSize * 0.5))
            .foregroundStyle(.white)
            .frame(width: Self.iconSize, height: Self.iconSize)
            .background(Color(hex: "5B9BD5"))
            .clipShape(RoundedRectangle(cornerRadius: Self.iconSize * 0.25, style: .continuous))
    }

    private func sfSymbol(for faIcon: String) -> String {
        let key = faIcon.components(separatedBy: " ").last?.replacingOccurrences(of: "fa-", with: "") ?? ""
        let map: [String: String] = [
            "book": "book.fill", "book-open": "book",
            "chalkboard-user": "graduationcap.fill",
            "atom": "staroflife.fill", "chess": "crown.fill",
            "computer": "desktopcomputer", "database": "cylinder.fill",
            "dna": "staroflife.fill", "draw-polygon": "pentagon.fill",
            "earth-africa": "globe.europe.africa.fill",
            "earth-americas": "globe.americas.fill",
            "earth-asia": "globe.asia.australia.fill",
            "earth-europe": "globe.europe.africa.fill",
            "flask": "flask.fill", "globe": "globe",
            "guitar": "guitars", "heart-pulse": "waveform.path.ecg",
            "infinity": "infinity", "landmark": "building.columns.fill",
            "language": "character.bubble.fill", "microchip": "cpu.fill",
            "music": "music.note", "chart-bar": "chart.bar.fill",
            "pizza-slice": "fork.knife", "plus": "plus.circle.fill",
            "puzzle-piece": "puzzlepiece.fill",
            "satellite": "antenna.radiowaves.left.and.right",
            "superscript": "x.squareroot", "table-cells": "tablecells.fill",
            "wave-square": "waveform", "golang": "chevron.left.forwardslash.chevron.right",
            "java": "curlybraces", "js": "curlybraces",
            "python": "curlybraces", "rust": "curlybraces",
        ]
        return map[key] ?? "book.fill"
    }
}
