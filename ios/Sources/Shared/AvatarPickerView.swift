import SwiftUI

/// Ports web's `generatePixelArtSVG()`/`renderAvatarPicker()` (js/lingo-app.js) to SwiftUI.
/// Renders a random 8x8 pixel-art avatar as a PNG data URI so it's stored/displayed
/// identically to web's SVG data URIs (both just need `data:` + `<img src>`/`Image`).
enum PixelArtAvatar {
    private static let palettes: [[Color]] = [
        [Color(hex: "e63946"), Color(hex: "457b9d"), Color(hex: "1d3557")],
        [Color(hex: "7b2d8b"), Color(hex: "c77dff"), Color(hex: "e0aaff")],
        [Color(hex: "0077b6"), Color(hex: "00b4d8"), Color(hex: "90e0ef")],
        [Color(hex: "d62828"), Color(hex: "f77f00"), Color(hex: "fcbf49")],
        [Color(hex: "2d6a4f"), Color(hex: "52b788"), Color(hex: "b7e4c7")],
    ]
    private static let backgrounds: [Color] = [
        Color(hex: "111111"), Color(hex: "0d0d0d"), Color(hex: "1a1a1a"), Color(hex: "0f0f1a"), Color(hex: "0a1a0a"),
    ]

    /// Mirrors web's mirrored-grid pixel art, rendered to a PNG data URI.
    @MainActor
    static func generate() -> String {
        let palette = palettes.randomElement()!
        let bg = backgrounds.randomElement()!
        let size = 8, px: CGFloat = 8, total = CGFloat(size) * px
        var grid: [[Int]] = []
        for _ in 0..<size {
            var row: [Int] = []
            for _ in 0..<((size + 1) / 2) {
                row.append(Double.random(in: 0...1) > 0.45 ? Int.random(in: 0..<3) : -1)
            }
            grid.append(row)
        }

        let view = Canvas(rendersAsynchronously: false) { context, canvasSize in
            context.fill(Path(CGRect(origin: .zero, size: canvasSize)), with: .color(bg))
            for row in 0..<size {
                for col in 0..<size {
                    let mirroredCol = col < size / 2 ? col : size - 1 - col
                    let ci = grid[row][mirroredCol]
                    guard ci >= 0 else { continue }
                    let rect = CGRect(x: CGFloat(col) * px, y: CGFloat(row) * px, width: px, height: px)
                    context.fill(Path(rect), with: .color(palette[ci]))
                }
            }
        }
        .frame(width: total, height: total)

        let renderer = ImageRenderer(content: view)
        renderer.scale = 1
        #if os(iOS)
        let pngData = renderer.uiImage?.pngData()
        #else
        let pngData = renderer.nsImage?.tiffRepresentation.flatMap {
            NSBitmapImageRep(data: $0)?.representation(using: .png, properties: [:])
        }
        #endif
        guard let data = pngData else { return "data:," }
        return "data:image/png;base64,\(data.base64EncodedString())"
    }

    static func isDataAvatar(_ id: String?) -> Bool {
        id?.hasPrefix("data:") ?? false
    }
}

/// Tap-to-regenerate avatar picker — matches web's "click avatar to refresh, instant, persists" UX.
struct AvatarPickerView: View {
    @Binding var avatarId: String

    var body: some View {
        Button {
            avatarId = PixelArtAvatar.generate()
        } label: {
            avatarImage
                .frame(width: 56, height: 56)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Avatar — tap to generate a new one")
        .onAppear {
            if !PixelArtAvatar.isDataAvatar(avatarId) {
                avatarId = PixelArtAvatar.generate()
            }
        }
    }

    @ViewBuilder
    private var avatarImage: some View {
        if let commaIndex = avatarId.range(of: "base64,")?.upperBound,
           let data = Data(base64Encoded: String(avatarId[commaIndex...])) {
            #if os(iOS)
            if let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage).resizable()
            } else {
                Color.gray.opacity(0.3)
            }
            #else
            if let nsImage = NSImage(data: data) {
                Image(nsImage: nsImage).resizable()
            } else {
                Color.gray.opacity(0.3)
            }
            #endif
        } else {
            Color.gray.opacity(0.3)
        }
    }
}
