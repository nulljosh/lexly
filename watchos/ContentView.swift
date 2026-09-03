import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            StreakView()
            PairingView()
        }
        .tabViewStyle(.verticalPage)
    }
}
