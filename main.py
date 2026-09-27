"""Optional desktop client for Lyricsify (the primary app is the static web app)."""

from __future__ import annotations

import os
import queue
import sqlite3
import threading
import tkinter as tk
from pathlib import Path
from tkinter import ttk

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "database.db"
RESULTS: queue.Queue = queue.Queue()


def start_db() -> None:
    """Create the local cache tables, keeping the connection on the UI thread."""
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS lyrics (
                lyric_id INTEGER PRIMARY KEY,
                artist TEXT NOT NULL,
                lyrics TEXT NOT NULL,
                title TEXT NOT NULL
            )"""
        )
        connection.execute(
            """CREATE TABLE IF NOT EXISTS artists (
                artist_id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )"""
        )


def display_message(message: str) -> None:
    lyrics_text.configure(state="normal")
    lyrics_text.delete("1.0", tk.END)
    lyrics_text.insert(tk.END, message)


def show_artists() -> None:
    with sqlite3.connect(DB_PATH) as connection:
        artists = connection.execute(
            "SELECT DISTINCT artist FROM lyrics ORDER BY artist COLLATE NOCASE"
        ).fetchall()
    if not artists:
        display_message("No artists found in your local library yet.")
        return

    window = tk.Toplevel(root)
    window.title("Artists in your library")
    window.geometry("400x520")
    window.configure(bg="#191414")
    for (name,) in artists:
        ttk.Button(
            window,
            text=name,
            command=lambda artist=name: show_tracks(artist),
        ).pack(fill=tk.X, padx=14, pady=5)


def show_tracks(artist: str) -> None:
    with sqlite3.connect(DB_PATH) as connection:
        tracks = connection.execute(
            "SELECT title FROM lyrics WHERE artist = ? ORDER BY title COLLATE NOCASE",
            (artist,),
        ).fetchall()
    if not tracks:
        display_message("No tracks found for this artist.")
        return

    window = tk.Toplevel(root)
    window.title(f"Tracks by {artist}")
    window.geometry("400x520")
    window.configure(bg="#191414")
    for (title,) in tracks:
        ttk.Button(
            window,
            text=title,
            command=lambda track=title: search_lyrics(track),
        ).pack(fill=tk.X, padx=14, pady=5)


def search_lyrics(track: str | None = None) -> None:
    """Check the local cache first, then query Genius without freezing Tk."""
    query = (track or song_entry.get()).strip()
    if not query:
        display_message("Enter a song, artist, or lyric to search for.")
        song_entry.focus_set()
        return

    song_entry.delete(0, tk.END)
    pattern = f"%{query}%"
    with sqlite3.connect(DB_PATH) as connection:
        cached = connection.execute(
            """SELECT artist, lyrics, title FROM lyrics
               WHERE title LIKE ? OR lyrics LIKE ? OR artist LIKE ?
               ORDER BY CASE WHEN title LIKE ? THEN 0 ELSE 1 END
               LIMIT 1""",
            (pattern, pattern, pattern, pattern),
        ).fetchone()
    if cached:
        artist, lyrics, title = cached
        display_message(f"{title} — {artist}\n\n{lyrics}")
        status.set("Showing a song saved on this device.")
        return

    token = os.getenv("genius_token", "").strip()
    if not token or token == "TOKEN_HERE":
        display_message(
            "No local match found. To use Genius in the desktop client, add a valid "
            "genius_token to your .env file.\n\nThe Lyricsify web app can search "
            "LRCLIB and Lyrics.ovh without a Genius token."
        )
        return

    search_button.configure(state="disabled")
    status.set("Searching Genius…")
    display_message(f"Searching for “{query}”…")

    def worker() -> None:
        try:
            import lyricsgenius

            genius = lyricsgenius.Genius(token, timeout=15, retries=1, skip_non_songs=True)
            song = genius.search_song(query)
            RESULTS.put((query, song, None))
        except Exception as error:  # surfaced in the UI instead of crashing the app
            RESULTS.put((query, None, str(error)))

    threading.Thread(target=worker, daemon=True).start()
    root.after(100, check_search_result)


def check_search_result() -> None:
    try:
        query, song, error = RESULTS.get_nowait()
    except queue.Empty:
        root.after(100, check_search_result)
        return

    search_button.configure(state="normal")
    if error:
        display_message(f"Couldn't search Genius: {error}")
        status.set("Search failed. Check your connection and Genius token.")
        return
    if not song:
        display_message(f"Sorry, lyrics for '{query}' were not found.")
        status.set("No lyrics found.")
        return

    artist = song.primary_artist.name
    lyrics = song.lyrics or ""
    title = song.title
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            "INSERT OR REPLACE INTO lyrics (lyric_id, artist, lyrics, title) VALUES (?, ?, ?, ?)",
            (song.id, artist, lyrics, title),
        )
        connection.execute(
            "INSERT OR IGNORE INTO artists (artist_id, name) VALUES (?, ?)",
            (song.primary_artist.id, artist),
        )
    display_message(f"{title} — {artist}\n\n{lyrics}")
    status.set(f"Lyrics provided by Genius for “{title}”.")


def build_app() -> None:
    global root, song_entry, lyrics_text, search_button, status

    root = tk.Tk()
    root.title("Lyricsify")
    root.geometry("620x760")
    root.minsize(420, 520)
    root.configure(bg="#191414")
    style = ttk.Style(root)
    if "lyricsify" not in style.theme_names():
        style.theme_create(
            "lyricsify",
            parent="clam",
            settings={
                "TLabel": {"configure": {"background": "#191414", "foreground": "#f4f0e7"}},
                "TButton": {
                    "configure": {"background": "#d8f277", "foreground": "#191a13", "padding": 9, "font": ("Arial", 11, "bold")},
                    "map": {"background": [("active", "#e3ff8e"), ("disabled", "#777777")]},
                },
                "TEntry": {"configure": {"padding": 9, "font": ("Arial", 12)}},
            },
        )
    style.theme_use("lyricsify")

    ttk.Label(root, text="Lyricsify", font=("Arial", 25, "bold")).pack(pady=(22, 3))
    ttk.Label(root, text="Find the words behind the music", foreground="#aaa89f").pack(pady=(0, 16))
    ttk.Label(root, text="Search by song, artist, or a lyric", font=("Arial", 11)).pack(pady=(0, 6))
    song_entry = ttk.Entry(root)
    song_entry.pack(fill=tk.X, padx=28, pady=4)
    song_entry.bind("<Return>", lambda _event: search_lyrics())
    controls = ttk.Frame(root)
    controls.pack(pady=9)
    search_button = ttk.Button(controls, text="Search", command=search_lyrics)
    search_button.pack(side=tk.LEFT, padx=5)
    ttk.Button(controls, text="Artists", command=show_artists).pack(side=tk.LEFT, padx=5)

    body = tk.Frame(root, bg="#191414")
    body.pack(fill=tk.BOTH, expand=True, padx=28, pady=(8, 6))
    scrollbar = ttk.Scrollbar(body)
    scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    lyrics_text = tk.Text(
        body,
        wrap=tk.WORD,
        font=("Arial", 12),
        bg="#201f1b",
        fg="#f1efe7",
        insertbackground="#d8f277",
        padx=15,
        pady=14,
        yscrollcommand=scrollbar.set,
        relief=tk.FLAT,
    )
    lyrics_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
    scrollbar.configure(command=lyrics_text.yview)
    status = tk.StringVar(value="Search lyrics or browse your local library.")
    ttk.Label(root, textvariable=status, anchor="w").pack(fill=tk.X, padx=28, pady=(2, 14))
    root.mainloop()


if __name__ == "__main__":
    load_dotenv(BASE_DIR / ".env")
    start_db()
    build_app()
