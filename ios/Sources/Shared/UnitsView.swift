import SwiftUI

struct UnitsView: View {
    var store: ContentStore
    var subject: Subject
    @State private var course: CoursePack?

    var body: some View {
        List {
            if let course {
                ForEach(course.units) { unit in
                    let done = unit.lessons.filter { store.progress.completedLessonIds.contains("\(subject.id):\($0.id)") }.count
                    Section {
                        if unit.tip != nil || !(unit.preview ?? []).isEmpty {
                            UnitIntro(unit: unit)
                        }
                        ForEach(unit.lessons) { lesson in
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
                        HStack {
                            Text(unit.title)
                            Spacer()
                            Text("\(done)/\(unit.lessons.count)")
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.secondary)
                        }
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
            if course == nil { course = store.loadCourse(subject) }
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
