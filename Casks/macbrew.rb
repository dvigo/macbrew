cask "macbrew" do
  version "1.0.0"
  sha256 "ed7ff65d4ec46bffd933f450ad61ca73add465c8b787749163aace4a57c99f6e"

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
