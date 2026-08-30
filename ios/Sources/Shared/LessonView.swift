import SwiftUI
import AVFoundation

/// One synthesizer for the whole app: AVSpeechSynthesizer stops speaking if it is
/// deallocated mid-utterance, which is exactly what happens to a @State instance
/// when SwiftUI re-renders the exercise.
enum Speech {
    private static let synthesizer = AVSpeechSynthesizer()

    static func speak(_ text: String, lang: String?) {
        guard !text.isEmpty else { return }
        synthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        if let lang { utterance.voice = AVSpeechSynthesisVoice(language: lang) }
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.9
        synthesizer.speak(utterance)
    }
}

struct LessonView: View {
    var store: ContentStore
    var subjectId: String
    var lesson: Lesson
    /// Course language for TTS. Nil on non-language packs, where it is unused.
    var lang: String?

    @State private var index = 0
    @State private var input = ""
    @State private var selected: String?
    @State private var picked: [String] = []
    @State private var feedback: FeedbackState?
    @State private var exerciseKey = UUID()
    @State private var pressedChoice: String?
    @State private var correctCount = 0
    @State private var matchedCount = 0
    @State private var matchMissed = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 16) {
                if index < lesson.exercises.count {
                    let exercise = lesson.exercises[index]
                    VStack(alignment: .leading, spacing: 16) {
                        HeartsRow(hearts: store.progress.hearts)
                        Text(prompt(for: exercise)).font(.title3.bold())

                        switch exercise.type {
                        case "sentence":
                            WordBank(
                                words: exercise.words ?? [],
                                picked: $picked,
                                locked: feedback != nil
                            )
                        case "match":
                            MatchGrid(
                                pairs: exercise.pairs ?? [],
                                matchedCount: $matchedCount,
                                missed: $matchMissed
                            )
                        case "listening":
                            Button {
                                Speech.speak(exercise.audio ?? exercise.answer, lang: lang)
                            } label: {
                                Label("Play", systemImage: "speaker.wave.2.fill")
                            }
                            .buttonStyle(.bordered)
                            TextField("Type what you hear", text: $input)
                                .textFieldStyle(.roundedBorder)
                                .disabled(feedback != nil)
                        default:
                            if let choices = exercise.choices {
                                ForEach(choices, id: \.self) { choice in
                                    ChoiceButton(
                                        choice: choice,
                                        isSelected: selected == choice,
                                        isPressed: pressedChoice == choice
                                    ) {
                                        guard feedback == nil else { return }
                                        pressedChoice = choice
                                        withAnimation(.spring(response: 0.25, dampingFraction: 0.6)) {
                                            selected = choice
                                        }
                                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { pressedChoice = nil }
                                    }
                                }
                            } else {
                                TextField("Your answer", text: $input)
                                    .textFieldStyle(.roundedBorder)
                                    .disabled(feedback != nil)
                            }
                        }

                        Button(feedback == nil ? "Check" : "Continue") {
                            feedback == nil ? check(exercise) : advance()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(feedback == nil && given(for: exercise).isEmpty)
                    }
                    .id(exerciseKey)
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .move(edge: .leading).combined(with: .opacity)
                    ))
                    .onAppear {
                        if exercise.type == "listening" {
                            Speech.speak(exercise.audio ?? exercise.answer, lang: lang)
                        }
                    }
                } else {
                    LessonSummary(
                        passed: store.lessonPassed(correct: correctCount, total: lesson.exercises.count),
                        correct: correctCount,
                        total: lesson.exercises.count
                    ) {
                        if store.lessonPassed(correct: correctCount, total: lesson.exercises.count) {
                            store.completeLesson(subjectId, lesson.id)
                        }
                        dismiss()
                    }
                }
                Spacer()
            }
            .padding()

            if let fb = feedback {
                FeedbackBanner(state: fb)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .navigationTitle(lesson.title)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .onAppear { store.startLesson() }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: feedback)
        // ponytail: driven off the existing feedback state, so the wrong-answer buzz is free.
        // .sensoryFeedback is cross-platform and simply no-ops on macOS, hence no #if fence.
        .sensoryFeedback(trigger: feedback) { _, new in
            guard let new else { return nil }
            return new == .correct ? .success : .error
        }
    }

    /// Web parity: the listening prompt is the instruction, not the answer text.
    private func prompt(for exercise: Exercise) -> String {
        exercise.type == "listening" ? "Type what you hear" : exercise.question
    }

    private func given(for exercise: Exercise) -> String {
        switch exercise.type {
        case "sentence": return picked.joined(separator: " ")
        case "match":
            // Enables Check only once every pair is placed; `missed` decides the grade.
            return matchedCount == (exercise.pairs?.count ?? 0) ? exercise.answer : ""
        case "listening": return input.trimmingCharacters(in: .whitespaces)
        default: return exercise.choices != nil
            ? (selected ?? "")
            : input.trimmingCharacters(in: .whitespaces)
        }
    }

    private func check(_ exercise: Exercise) {
        let correct = exercise.type == "match"
            ? !matchMissed
            : normalize(given(for: exercise)) == normalize(exercise.answer)
        if correct { correctCount += 1 }
        store.recordAnswer(correct: correct, exerciseId: exercise.id, lessonId: lesson.id)
        withAnimation { feedback = correct ? .correct : .incorrect(exercise.answer) }
    }

    /// Answers are compared ignoring spacing, case, and trailing punctuation so a
    /// word-bank answer and a typed one grade the same way.
    private func normalize(_ text: String) -> String {
        text.lowercased()
            .trimmingCharacters(in: CharacterSet.punctuationCharacters.union(.whitespaces))
            .replacingOccurrences(of: " ", with: "")
    }

    private func advance() {
        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
            feedback = nil; exerciseKey = UUID(); index += 1
            input = ""; selected = nil; picked = []
            matchedCount = 0; matchMissed = false
        }
    }
}

/// Tap-to-build word bank, mirroring the web renderer in js/lingo-app.js.
private struct WordBank: View {
    let words: [String]
    @Binding var picked: [String]
    let locked: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            FlowRow {
                ForEach(Array(picked.enumerated()), id: \.offset) { offset, word in
                    Chip(word) { guard !locked else { return }; picked.remove(at: offset) }
                }
            }
            .frame(minHeight: 44, alignment: .topLeading)
            .overlay(alignment: .bottom) { Divider() }

            FlowRow {
                ForEach(Array(words.enumerated()), id: \.offset) { offset, word in
                    if !usedOffsets.contains(offset) {
                        Chip(word) { guard !locked else { return }; picked.append(word) }
                    }
                }
            }
        }
    }

    /// A word can legitimately appear twice in one sentence, so consume by position:
    /// match each picked word to the first not-yet-consumed bank slot holding it.
    private var usedOffsets: Set<Int> {
        var used: Set<Int> = []
        for word in picked {
            if let offset = words.indices.first(where: { words[$0] == word && !used.contains($0) }) {
                used.insert(offset)
            }
        }
        return used
    }
}

/// Two columns; tap one side then the other. A mispair is remembered in `missed` so
/// the exercise still grades as incorrect while the user keeps going. Web parity:
/// `selectMatch` in js/lingo-app.js.
private struct MatchGrid: View {
    let pairs: [[String]]
    @Binding var matchedCount: Int
    @Binding var missed: Bool

    @State private var selection: Cell?
    @State private var matched: Set<Int> = []
    @State private var shuffled: [Int] = []

    private struct Cell: Equatable { let key: Int; let isPrompt: Bool }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            column(keys: pairs.indices.map { $0 }, isPrompt: true)
            column(keys: shuffled, isPrompt: false)
        }
        .onAppear { if shuffled.isEmpty { shuffled = pairs.indices.shuffled() } }
    }

    private func column(keys: [Int], isPrompt: Bool) -> some View {
        VStack(spacing: 12) {
            ForEach(keys, id: \.self) { key in
                let cell = Cell(key: key, isPrompt: isPrompt)
                let text = isPrompt ? pairs[key].first ?? "" : pairs[key].last ?? ""
                Button { tap(cell) } label: {
                    Text(text)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(background(for: cell))
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(matched.contains(key))
                .opacity(matched.contains(key) ? 0.55 : 1)
            }
        }
    }

    private func background(for cell: Cell) -> Color {
        if matched.contains(cell.key) { return Color(hex: "f0faf4") }
        if selection == cell { return Color(hex: "5B9BD5").opacity(0.15) }
        return Color.secondary.opacity(0.12)
    }

    private func tap(_ cell: Cell) {
        guard let previous = selection else { selection = cell; return }
        if previous == cell { selection = nil; return }
        selection = nil
        guard previous.isPrompt != cell.isPrompt else { return }

        if previous.key == cell.key {
            matched.insert(cell.key)
            matchedCount = matched.count
        } else {
            missed = true
        }
    }
}

private struct Chip: View {
    let text: String
    let action: () -> Void

    init(_ text: String, action: @escaping () -> Void) {
        self.text = text
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(text)
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(Color.secondary.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

/// ponytail: SwiftUI has no wrapping HStack, and Layout is ~20 lines. Not worth a package.
private struct FlowRow: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for size in subviews.map({ $0.sizeThatFits(.unspecified) }) {
            if x + size.width > width, x > 0 { x = 0; y += rowHeight + spacing; rowHeight = 0 }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: proposal.width ?? x, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX; y += rowHeight + spacing; rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

private struct HeartsRow: View {
    let hearts: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<5, id: \.self) { index in
                Image(systemName: index < hearts ? "heart.fill" : "heart")
                    .foregroundStyle(index < hearts ? Color(hex: "c44040") : Color.secondary.opacity(0.4))
            }
        }
        .font(.footnote)
        .accessibilityLabel("\(hearts) hearts remaining")
    }
}

private struct LessonSummary: View {
    let passed: Bool
    let correct: Int
    let total: Int
    let done: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: passed ? "checkmark.circle.fill" : "arrow.counterclockwise.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(Color(hex: passed ? "5B9BD5" : "c44040"))
            Text(passed ? "Lesson complete!" : "Try again").font(.title.bold())
            Text("\(correct) of \(total) correct").foregroundStyle(.secondary)
            Button("Done", action: done).buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct ChoiceButton: View {
    let choice: String
    let isSelected: Bool
    let isPressed: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack { Text(choice); Spacer() }
                .padding()
                .background(isSelected ? Color(hex: "5B9BD5").opacity(0.15) : Color.secondary.opacity(0.12))
                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(isSelected ? Color(hex: "5B9BD5") : .clear, lineWidth: 2))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
        .scaleEffect(isPressed ? 0.96 : 1.0)
        .animation(.spring(response: 0.2, dampingFraction: 0.6), value: isPressed)
    }
}

enum FeedbackState: Equatable {
    case correct
    case incorrect(String)
}

private struct FeedbackBanner: View {
    let state: FeedbackState
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: state == .correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text(state == .correct ? "Correct!" : "Incorrect").font(.headline)
                if case .incorrect(let answer) = state {
                    Text("Answer: \(answer)").font(.subheadline)
                }
            }
            Spacer()
        }
        .foregroundStyle(state == .correct ? Color(hex: "2d7a50") : Color(hex: "c44040"))
        .padding()
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(state == .correct ? Color(hex: "f0faf4") : Color(hex: "faf0f0")))
        .padding()
    }
}
