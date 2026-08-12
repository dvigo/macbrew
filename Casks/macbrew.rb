cask "macbrew" do
  version "1.1.0"
  sha256 "c5a19ab0131a6bebbcf2b38651e1f56a0dde94958c5888a71d1a47e29b3c201d"

  url "https://github.com/dvigo/macbrew/releases/download/v#{version}/MacBrew-#{version}-arm64.dmg"
  name "MacBrew"
  desc "The ultimate macOS app installer & Homebrew GUI package manager"
  homepage "https://macbrew-neon.vercel.app"

  livecheck do
    url "https://github.com/dvigo/macbrew/releases/latest"
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: :catalina

  app "MacBrew.app"

  postflight do
    system_command "xattr", args: ["-cr", "#{appdir}/MacBrew.app"]
  end

  zap trash: [
    "~/Library/Application Support/MacBrew",
    "~/Library/Caches/app.macbrew.desktop",
    "~/Library/Preferences/app.macbrew.desktop.plist",
    "~/Library/Saved Application State/app.macbrew.desktop.savedState",
  ]
end
