cask "macbrew" do
  version "1.1.0"
  sha256 "db1c7db2ccd9b1d5ee2df34377d14f69a186a0511fe82b1f5fc0408890b408e3"

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
