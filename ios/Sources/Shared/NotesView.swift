import SwiftUI

struct NotesView: View {
    var store: ContentStore
    var subject: Subject
    @State private var notes: Notes?

    var body: some View {
        ScrollView {
            if let notes {
                LazyVStack(alignment: .leading, spacing: 24) {
                    ForEach(notes.sections) { section in
                        VStack(alignment: .leading, spacing: 4) {
                            if !section.unitTag.isEmpty {
                                Text(section.unitTag.uppercased())
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(Color(hex: "5B9BD5"))
                            }
                            Text(section.title)
                                .font(.title3.weight(.bold))
                            VStack(alignment: .leading, spacing: 10) {
                                ForEach(section.blocks) { block in
                                    NotesBlockView(block: block)
                                }
                            }
                            .padding(.top, 4)
                        }
                        Divider()
                    }
                }
                .padding()
            } else {
                ProgressView().padding()
            }
        }
        .navigationTitle(subject.name)
        .navigationBarTitleDisplayModeIfAvailable()
        .onAppear {
            if notes == nil { notes = store.loadNotes(subject) }
        }
    }
}

private struct NotesBlockView: View {
    let block: NotesBlock

    var body: some View {
        switch block.type {
        case "heading":
            Text(block.text ?? "")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.orange)
                .padding(.top, 6)
        case "p":
            Text(block.text ?? "")
                .font(.callout)
                .foregroundStyle(.secondary)
        case "formula":
            Text(block.text ?? "")
                .font(.system(.footnote, design: .monospaced))
                .foregroundStyle(.blue)
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.blue.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 6))
        case "list":
            VStack(alignment: .leading, spacing: 4) {
                ForEach(Array((block.items ?? []).enumerated()), id: \.offset) { i, item in
                    HStack(alignment: .top, spacing: 6) {
                        Text((block.ordered ?? false) ? "\(i + 1)." : "•")
                            .foregroundStyle(.secondary)
                        Text(item).font(.callout).foregroundStyle(.secondary)
                    }
                }
            }
        case "warn", "tip", "info":
            CalloutView(kind: block.type, title: block.title, items: block.items ?? [])
        case "example":
            VStack(alignment: .leading, spacing: 6) {
                if let title = block.title, !title.isEmpty {
                    Text(title.uppercased())
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.yellow)
                }
                ForEach(Array((block.steps ?? []).enumerated()), id: \.offset) { _, step in
                    Text(step).font(.callout)
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.gray.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        case "table":
            NotesTableView(headers: block.headers ?? [], rows: block.rows ?? [])
        case "modgrid":
            VStack(alignment: .leading, spacing: 10) {
                ForEach(block.modules ?? []) { mod in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(mod.title.uppercased())
                            .font(.caption.weight(.bold))
                            .foregroundStyle(Color(hex: "5B9BD5"))
                        ForEach(mod.items, id: \.self) { item in
                            Text("• \(item)").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.gray.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        case "flashcards":
            VStack(spacing: 10) {
                ForEach(block.cards ?? []) { card in
                    FlashcardView(card: card)
                }
            }
        default:
            EmptyView()
        }
    }
}

private struct CalloutView: View {
    let kind: String
    let title: String?
    let items: [String]

    var color: Color {
        switch kind {
        case "warn": return .red
        case "tip": return .green
        default: return .blue
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let title, !title.isEmpty {
                Text(title.uppercased())
                    .font(.caption.weight(.bold))
                    .foregroundStyle(color)
            }
            ForEach(items, id: \.self) { item in
                Text(item).font(.callout).foregroundStyle(color.opacity(0.85))
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

private struct NotesTableView: View {
    let headers: [String]
    let rows: [[String]]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 8) {
                GridRow {
                    ForEach(headers, id: \.self) { h in
                        Text(h.uppercased()).font(.caption2.weight(.bold)).foregroundStyle(.secondary)
                    }
                }
                Divider()
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    GridRow {
                        ForEach(row, id: \.self) { cell in
                            Text(cell).font(.caption)
                        }
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }
}

private struct FlashcardView: View {
    let card: NotesFlashcard
    @State private var revealed = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(card.q).font(.callout.weight(.semibold))
            if revealed {
                Divider()
                Text(card.a).font(.callout).foregroundStyle(.green)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.gray.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .contentShape(Rectangle())
        .onTapGesture { withAnimation { revealed.toggle() } }
    }
}

private extension View {
    @ViewBuilder
    func navigationBarTitleDisplayModeIfAvailable() -> some View {
        #if os(iOS)
        self.navigationBarTitleDisplayMode(.inline)
        #else
        self
        #endif
    }
}
