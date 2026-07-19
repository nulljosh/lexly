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
                        ForEach(unit.lessons) { lesson in
                            NavigationLink {
                                LessonView(store: store, subjectId: subject.id, lesson: lesson)
                            } label: {
                                HStack {
                                    Text(lesson.title)
                                    Spacer()
                                    if store.progress.completedLessonIds.contains("\(subject.id):\(lesson.id)") {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(Color(hex: "5B9BD5"))
                                    }
                                }
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
        .onAppear {
            if course == nil { course = store.loadCourse(subject) }
        }
    }
}
