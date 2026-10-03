import SwiftUI

struct UnitsView: View {
    var store: ContentStore
    var subject: Subject
    @State private var course: CoursePack?
    @State private var expanded: Set<String> = []

    private func isDone(_ lesson: Lesson) -> Bool {
        store.progress.completedLessonIds.contains("\(subject.id):\(lesson.id)")
    }

    var body: some View {
        List {
            if let course {
                // Web parity: a long course folds each unit to one line and puts Continue on top.
                let collapsible = course.units.count > 4
                if let next = course.units.flatMap(\.lessons).first(where: { !isDone($0) }) {
                    Section {
                        NavigationLink {
                            LessonView(store: store, subjectId: subject.id, lesson: next, lang: course.lang)
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(store.progress.completedLessonIds.contains { $0.hasPrefix("\(subject.id):") } ? "Continue" : "Start")
                                    .font(.caption2.weight(.semibold))
                                    .textCase(.uppercase)
                                    .foregroundStyle(.secondary)
                                Text(next.title).font(.headline)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
                ForEach(course.units) { unit in
                    let done = unit.lessons.filter { isDone($0) }.count
                    let isOpen = !collapsible || expanded.contains(unit.id)
                    Section {
                        if isOpen, unit.tip != nil || !(unit.preview ?? []).isEmpty {
                            UnitIntro(unit: unit)
                        }
                        ForEach(isOpen ? unit.lessons : []) { lesson in
                            NavigationLink {
                                LessonView(store: store, subjectId: subject.id, lesson: lesson, lang: course.lang)
                            } label: {
                                HStack {
                                    Text(lesson.title)
                                    Spacer()
                                    if store.progress.completedLessonIds.contains("\(subject.id):\(lesson.id)") {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(Color(hex: "5B9BD5"))
                                    }
                                }
                                #if os(macOS)
                                .padding(.vertical, 4)
                                #endif
                            }
                        }
                    } header: {
                        Button {
                            guard collapsible else { return }
                            if expanded.contains(unit.id) { expanded.remove(unit.id) } else { expanded.insert(unit.id) }
                        } label: {
                            HStack {
                                Text(unit.title)
                                Spacer()
                                Text("\(done)/\(unit.lessons.count)")
                                    .font(.caption.monospacedDigit())
                                    .foregroundStyle(.secondary)
                                if collapsible {
                                    Image(systemName: isOpen ? "chevron.up" : "chevron.down")
                                        .font(.caption2)
                                }
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(.isButton)
                        .accessibilityHint(collapsible ? (isOpen ? "Collapse unit" : "Expand unit") : "")
                    }
                }
            } else {
                Text("Couldn't load \(subject.name).")
            }
        }
        .navigationTitle(subject.name)
        #if os(macOS)
        .listStyle(.inset)
        #endif
        .onAppear {
            if course == nil {
                course = store.loadCourse(subject)
                // Open only the unit you are in.
                if let unit = course?.units.first(where: { $0.lessons.contains { !isDone($0) } }) ?? course?.units.first {
                    expanded.insert(unit.id)
                }
            }
        }
    }
}

/// Web parity: the "Before you start" card in js/lingo-app.js. Until this existed a
/// lesson only ever tested -- nothing taught.
private struct UnitIntro: View {
    let unit: Unit

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Before you start")
                .font(.caption2.weight(.semibold))
                .textCase(.uppercase)
                .kerning(0.8)
                .foregroundStyle(.secondary)

            if let tip = unit.tip {
                Text(tip)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            ForEach(Array((unit.preview ?? []).enumerated()), id: \.offset) { _, pair in
                if pair.count == 2 {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(pair[1]).font(.footnote.weight(.semibold))
                        Text(pair[0]).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(.vertical, 6)
    }
}
