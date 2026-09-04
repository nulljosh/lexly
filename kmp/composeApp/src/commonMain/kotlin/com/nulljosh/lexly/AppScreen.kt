package com.nulljosh.lexly

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LexlyTheme(content: @Composable () -> Unit) =
    MaterialTheme(colorScheme = lightColorScheme(), content = content)

private val PLAYABLE_TYPES = setOf("translation", "mathChoice", "cloze")

// ponytail: renders translation/mathChoice/cloze (multiple-choice) exercises
// only, matching the "choices" row of CLAUDE.md's exercise table. sentence
// (word bank), listening (TTS) and match are not wired up yet. No login
// screen -- see Content.kt for why that's a deliberate match to iOS/macOS,
// not an oversight.
@Composable
fun AppScreen(client: LexlyClient = LexlyClient()) {
    var catalog by remember { mutableStateOf<Catalog?>(null) }
    var selected by remember { mutableStateOf<Subject?>(null) }
    var course by remember { mutableStateOf<Course?>(null) }
    var loadingCourse by remember { mutableStateOf(false) }
    var index by remember { mutableStateOf(0) }
    var score by remember { mutableStateOf(0) }
    var feedback by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        runCatching { catalog = client.catalog() }.onFailure { error = it.message ?: "failed to load catalog" }
    }

    LaunchedEffect(selected) {
        val subject = selected ?: return@LaunchedEffect
        loadingCourse = true
        index = 0; score = 0; feedback = null
        runCatching { course = client.course(subject.packPath) }
            .onFailure { error = it.message ?: "failed to load course" }
        loadingCourse = false
    }

    val exercises = remember(course) {
        course?.units?.flatMap { it.lessons }?.flatMap { it.exercises }
            ?.filter { it.type in PLAYABLE_TYPES && it.choices.isNotEmpty() } ?: emptyList()
    }

    Surface {
        Column(Modifier.fillMaxSize().padding(24.dp)) {
            Text("Lexly", style = MaterialTheme.typography.headlineMedium)
            when {
                error != null -> Text(error!!)
                selected == null -> {
                    val cat = catalog
                    if (cat == null) {
                        CircularProgressIndicator(Modifier.padding(top = 24.dp))
                    } else {
                        LazyColumn(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            cat.categories.values.forEach { category ->
                                items(category.subjects) { subject ->
                                    Button(onClick = { selected = subject }, modifier = Modifier.fillMaxWidth()) {
                                        Text(subject.name)
                                    }
                                }
                            }
                        }
                    }
                }
                loadingCourse -> CircularProgressIndicator(Modifier.padding(top = 24.dp))
                exercises.isEmpty() -> Text("No playable exercises in this course yet.", modifier = Modifier.padding(top = 24.dp))
                else -> {
                    val ex = exercises.getOrNull(index)
                    if (ex == null) {
                        Text("Done. Score: $score / ${exercises.size}", modifier = Modifier.padding(top = 24.dp))
                        Button(onClick = { selected = null; course = null }, modifier = Modifier.padding(top = 16.dp)) {
                            Text("Back to catalog")
                        }
                    } else {
                        Text(ex.question, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 24.dp))
                        Column(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            ex.choices.forEach { choice ->
                                Button(
                                    onClick = {
                                        if (feedback == null) {
                                            if (choice == ex.answer) { score++; feedback = "Correct!" }
                                            else feedback = "It was ${ex.answer}"
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                ) { Text(choice) }
                            }
                        }
                        feedback?.let {
                            Text(it, modifier = Modifier.padding(top = 16.dp))
                            Button(onClick = { feedback = null; index++ }, modifier = Modifier.padding(top = 8.dp)) {
                                Text("Next")
                            }
                        }
                    }
                }
            }
        }
    }
}
