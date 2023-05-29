# Developed by @momalekiii

import tkinter as tk
from tkinter import ttk
import lyricsgenius
import os
from dotenv import load_dotenv
import sqlite3

# If it doesn't exist, generate database or connect if it does
conn = sqlite3.connect("database.db")
c = conn.cursor()

# Load Env Variables
load_dotenv()

# API access
token = os.getenv("genius_token")
genius = lyricsgenius.Genius(token)


# Generate the database tables if they don't exist
def start_db():
    c.execute(
        """
          CREATE TABLE IF NOT EXISTS lyrics (
        lyric_id INTEGER PRIMARY KEY NOT NULL, 
          artist TEXT, 
          lyrics TEXT, 
          title VARCHAR(255))
          """
    )
    c.execute(
        """
            CREATE TABLE IF NOT EXISTS artists (
            artist_id INTEGER PRIMARY KEY NOT NULL,
            name VARCHAR(255) NOT NULL)
          """
    )

    conn.commit()


def show_artists():
    c.execute(
        """
            SELECT
            artist_id, name
            FROM artists
            """
    )
    artists = c.fetchall()
    # If we find a result lets display that
    if artists:
        artistsWindow = tk.Toplevel(root)
        artistsWindow.title("Artists")
        artistsWindow.geometry("480x720")
        artistsWindow.config(bg="#191414")
        artist_button = {}
        for artist in artists:
            artist_button[artist[0]] = ttk.Button(
                artistsWindow,
                text=f"{artist[1]}",
                command=lambda artistname=artist[0]: show_tracks(artistname),
            )
            artist_button[artist[0]].pack(pady=10, padx=10)
    else:
        lyrics_text.delete("1.0", tk.END)
        lyrics_text.insert(tk.END, "No artists found in database")


# search the db for all artists and display list
def show_tracks(artist_id):
    c.execute(
        f"""
            SELECT
            title, lyric_id, artist
            FROM lyrics 
            INNER JOIN artists ON artists.name = lyrics.artist
            WHERE artist_id = {artist_id}
            """
    )
    tracks = c.fetchall()
    # If we find a result lets display that
    if tracks:
        tracksWindow = tk.Toplevel(root)
        tracksWindow.title("Artist Tracks")
        tracksWindow.geometry("480x720")
        tracksWindow.config(bg="#191414")    
        track_button = {}
        for track in tracks:
            track_button[track[0]] = ttk.Button(
                tracksWindow,
                text=f"{track[0]}",
                command=lambda trackname=track[0]: search_lyrics(trackname),
            )
            track_button[track[0]].pack(pady=10, padx=10)
    else:
        lyrics_text.delete("1.0", tk.END)
        lyrics_text.insert(tk.END, "No tracks found")


# Function to search for lyrics and update the display
def search_lyrics(track=None):
    if song_entry.get() != "":
        song_name = song_entry.get()
    else:
        song_name = track
    song_entry.delete(0, tk.END)
    lyrics_text.pack(fill=tk.BOTH, expand=True)
    # Search the local database first
    c.execute(
        f"""
            SELECT
            lyrics
            FROM lyrics WHERE title LIKE '%{song_name}%'
            OR lyrics LIKE '%{song_name}%'
            """
    )
    result = c.fetchone()
    # If we find a result lets display that
    if result:
        print(f"found {song_name} in database")
        lyrics_text.delete("1.0", tk.END)
        lyrics_text.insert(tk.END, result)
    # If not, lets search genius and add it into the database
    else:
        print("nothing found, searching genius")
        song = genius.search_song(song_name)
        if song:
            lyrics_text.delete("1.0", tk.END)
            lyrics_text.insert(tk.END, song.lyrics)
            try:
                c.execute(
                    "INSERT INTO lyrics VALUES (?,?,?,?)",
                    (song.id, song.primary_artist.name, song.lyrics, song.title),
                )
            except sqlite3.IntegrityError:
                print(f"Error, {song.title} by {song.primary_artist.name} exists")
            try:
                c.execute(
                    "INSERT INTO artists VALUES (?,?)",
                    (song.primary_artist.id, song.primary_artist.name),
                )
            except sqlite3.IntegrityError:
                print(f"Error, {song.primary_artist.name} exists")
            conn.commit()
        else:
            lyrics_text.delete("1.0", tk.END)
            lyrics_text.insert(tk.END, f"Sorry, lyrics for '{song_name}' not found.")


# designing UI
root = tk.Tk()
root.title("Lyricsify")
root.geometry("480x720")
root.config(bg="#191414")
style = ttk.Style()
style.theme_create(
    "spotify",
    parent="alt",
    settings={
        "TLabel": {"configure": {"background": "#191414", "foreground": "white"}},
        "Vertical.TScrollbar": {
            "configure": {
                "background": "#1DB954",
                "foreground": "white",
                "bordercolor": "white",
                "arrowcolor": "white",
                "padding": 10,
            }
        },
        "TButton": {
            "configure": {
                "background": "#1DB954",
                "foreground": "white",
                "padding": 10,
                "font": ("Arial", 16),
                "borderwidth": 0,
            },
            "map": {"background": [("active", "#1ED760"), ("disabled", "grey")]},
        },
        "TEntry": {
            "configure": {
                "background": "white",
                "foreground": "black",
                "font": ("Arial", 16),
                "padding": 10,
                "borderwidth": 0,
            },
            "map": {"background": [("active", "#E6E6E6"), ("disabled", "grey")]},
        },
        "TText": {
            "configure": {
                "background": "#F2F2F2",
                "foreground": "black",
                "font": ("Arial", 12),
                "borderwidth": 0,
            }
        },
    },
)
style.theme_use("spotify")

scroll_bar = ttk.Scrollbar(root)
scroll_bar.pack(side=tk.RIGHT, fill=tk.Y)

header_label = ttk.Label(
    root, text="Lyricsify", font=("Arial", 24), foreground="white", anchor="center"
)
header_label.pack(pady=20)

song_label = ttk.Label(
    root, text="Enter song name or lyrics snippet:", font=("Arial", 16)
)
song_label.pack(pady=10)

song_entry = ttk.Entry(root, font=("Arial", 16))
song_entry.pack(pady=10)

search_button = ttk.Button(root, text="Search", command=search_lyrics)
search_button.pack(pady=10)

artists_button = ttk.Button(root, text="Artists", command=show_artists)
artists_button.pack(pady=10)

lyrics_text = tk.Text(root, font=("Arial", 12), yscrollcommand=scroll_bar.set)
lyrics_text.pack(fill=tk.BOTH, expand=True)

scroll_bar.config(command=lyrics_text.yview)

start_db()
root.mainloop()
