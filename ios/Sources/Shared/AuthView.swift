import SwiftUI

struct AuthView: View {
    var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @State private var mode: Mode = .signIn
    @State private var notice = ""
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var errorMessage = ""
    @State private var busy = false
    @State private var avatarId = "falcon"

    enum Mode { case signIn, signUp }

    var body: some View {
        VStack(spacing: 24) {
            LexlyMark(size: 72)
            Text("Lexly").font(.largeTitle.bold())
            Text("Learn anything.").foregroundStyle(.secondary)

            Picker("Mode", selection: $mode) {
                Text("Sign In").tag(Mode.signIn)
                    .accessibilityIdentifier("authModeSignIn")
                Text("Sign Up").tag(Mode.signUp)
                    .accessibilityIdentifier("authModeSignUp")
            }
            .pickerStyle(.segmented)

            VStack(spacing: 12) {
                if mode == .signUp {
                    AvatarPickerView(avatarId: $avatarId)
                    TextField("Display name", text: $displayName)
                        .textContentType(.name)
                        .textFieldStyle(.roundedBorder)
                }
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    #if os(iOS)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    #endif
                    .textFieldStyle(.roundedBorder)
                    .accessibilityIdentifier("emailField")
                SecureField("Password", text: $password)
                    .textContentType(mode == .signUp ? .newPassword : .password)
                    .textFieldStyle(.roundedBorder)
                    .accessibilityIdentifier("passwordField")
            }

            if !errorMessage.isEmpty {
                Text(errorMessage).foregroundStyle(.red).font(.footnote)
            } else if !notice.isEmpty {
                Text(notice).foregroundStyle(.secondary).font(.footnote)
                    .multilineTextAlignment(.center)
            }

            Button(action: submit) {
                if busy {
                    HStack(spacing: 8) {
                        ProgressView()
                        Text(mode == .signIn ? "Signing In…" : "Creating Account…")
                    }
                    .frame(maxWidth: .infinity)
                } else {
                    Text(mode == .signIn ? "Sign In" : "Create Account").frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(busy)
            .accessibilityIdentifier("authSubmit")
        }
        .padding(32)
    }

    /// Dismissing back to a Settings screen that now shows the account IS the success
    /// signal — the sheet used to just sit there after a good login, which read as
    /// "nothing happened".
    private func submit() {
        errorMessage = ""
        notice = ""
        busy = true
        Task {
            do {
                if mode == .signUp {
                    let signedIn = try await auth.signUp(email: email, password: password,
                                                         displayName: displayName.isEmpty ? "Learner" : displayName,
                                                         avatarId: avatarId)
                    busy = false
                    if signedIn {
                        dismiss()
                    } else {
                        mode = .signIn
                        password = ""
                        notice = "Account created. Check your email to confirm it, then sign in."
                    }
                    return
                }
                try await auth.signIn(email: email, password: password)
                busy = false
                dismiss()
                return
            } catch {
                errorMessage = error.localizedDescription
            }
            busy = false
        }
    }
}
