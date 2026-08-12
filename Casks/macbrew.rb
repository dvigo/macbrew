cask "macbrew" do
  version "1.0.0"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"

  url "https://github.com/dvigo/macbrew/releases/download/v#{version}/MacBrew-#{version}-universal.dmg"
  name "MacBrew"
  desc "The ultimate macOS app installer & Homebrew GUI package manager"
  homepage "https://macbrew.app"

  livecheck do
    url "https://github.com/dvigo/macbrew/releases/latest"
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :catalina"

  app "MacBrew.app"

  zap trash: [
    "~/Library/Application Support/MacBrew",
    "~/Library/Caches/app.macbrew.desktop",
    "~/Library/Preferences/app.macbrew.desktop.plist",
    "~/Library/Saved Application State/app.macbrew.desktop.savedState",
  ]
end
