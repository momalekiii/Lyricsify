# Lyricsify

Lyricsify is a phone-friendly, installable web app for finding song lyrics, saving songs in your browser, and turning 1–5 chosen lines into a shareable image. It includes English and Persian (RTL with Vazirmatn) languages, light and dark appearances, a liquid-glass interface, and a subtle cover-art color tint when a song is selected. Made with love by [@momalekiii](https://github.com/momalekiii). The app is plain HTML, CSS, and JavaScript: no build step, framework, server, or API key is needed for the web experience.

## Run it locally

The site uses browser APIs (including a service worker), so serve the files over HTTP rather than opening `index.html` directly:

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Then visit <http://localhost:8000>. Searches use two providers:

- **LRCLIB** for catalog search and lyric text. Artist/title searches try LRCLIB's exact-track endpoint and then its structured search, identifying Lyricsify with the client header required by LRCLIB's docs.
- **Lyrics.ovh** for direct artist/title lookups. Use `Artist - Song title` or `Song title by Artist` when selecting Lyrics.ovh.
- **Apple's iTunes Search API** for matching album-cover artwork and a track-metadata fallback when no lyric source matches; it does not provide lyrics.

Choose **All sources** to search LRCLIB and, when the query has an explicit artist/title format, Lyrics.ovh together. When a song is open, artist-specific search links are available for Spotify and SoundCloud; the links open each service's artist results because direct profile IDs are not provided by the lyrics sources. Lyrics availability varies by song and provider. Searches require an internet connection; the app shell is cached for subsequent visits, while saved songs are stored only in that browser's local storage.

## Share a lyric

1. Search and open a song.
2. Select 1–5 lyric lines, or type an excerpt in the snippet box. Longer selections are shortened to five lines with a warning.
3. Choose a card mood and select **Share card**, open **Instagram** to choose **Story (9:16)** or **Post (4:5)**, or use **Download image**, **Copy text**, or **Post to X**.

Share cards are rendered on-device as PNGs with matching album artwork when available (1080 × 1350 for posts, 1080 × 1920 for Stories). They omit Lyricsify branding and lyric-provider labels so the selected excerpt stays front and center. On phones, **Share card** uses the system share sheet when the browser supports sharing image files, so Instagram and other installed apps may appear as destinations. Otherwise it downloads the image for you to upload. **Post to X** opens X's composer with a short prefilled introduction, the selected line, and song credit; the user reviews and publishes it. The app does not log in to social accounts or post on a user's behalf. Social services decide which sharing options are available on a given device.

Lyrics are copyrighted works. Lyricsify does not operate a central lyric catalog; lyrics are fetched from the named providers and remain the property of their respective writers and publishers. Share thoughtfully and follow each provider's terms.

## Publish with GitHub Pages

The repository includes a GitHub Actions Pages workflow. After merging to `main`, enable **Settings → Pages → Build and deployment → GitHub Actions** in the repository if it is not already enabled. The workflow will publish the static site at the repository's GitHub Pages URL (usually `https://<owner>.github.io/<repository>/`). All app assets and manifest paths are relative, so it works under that project subpath. You can also start a deployment from **Actions → Deploy Lyricsify to GitHub Pages → Run workflow**.

## Install on a phone

Lyricsify is a Progressive Web App. On Android, open the HTTPS site in Chrome and choose **Install app** (or **Add to Home screen**). On iPhone/iPad, open it in Safari, tap **Share**, then **Add to Home Screen**. The app shell can open offline, but lyric searches need a connection. Browsers and social apps control whether image sharing is offered.

If a store-distributed mobile app is wanted later, this static app can be wrapped with Capacitor for Android and iOS. That adds platform build/signing work and does not bypass app-store policies or Instagram/X sharing restrictions. A native wrapper is not required to use the installable web app.

## Optional desktop client

`main.py` remains as a small Tkinter desktop client. It caches searches in a local SQLite database and queries Genius asynchronously, so a network request does not freeze the window. Genius is optional for the web app and is used only by this legacy desktop client:

```bash
python -m venv .venv
# Activate the environment, then:
pip install -r requirements.txt
cp .env.example .env
# Put your Genius API token in .env, then:
python main.py
```

The desktop client can still read cached songs without a token. The `database.db` file is local and ignored by Git.

## Development checks

```bash
node --check app.js
python -m py_compile main.py
```

## Credits

Created by [@momalekiii](https://github.com/momalekiii). Licensed under the [MIT License](LICENSE). Lyrics search and availability are provided by [LRCLIB](https://lrclib.net) and [Lyrics.ovh](https://lyrics.ovh). The original desktop client used the [Genius API](https://genius.com/developers).
