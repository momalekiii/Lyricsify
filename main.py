#Developed by @momalekiii

import tkinter as tk
from tkinter import ttk
import lyricsgenius
import os
from dotenv import load_dotenv

load_dotenv()

#API access
token = os.getenv('genius_token')
genius = lyricsgenius.Genius(token)

# Function to search for lyrics and update the display
def search_lyrics():
    song_name = song_entry.get()
    song = genius.search_song(song_name)
    if song:
        lyrics_text.delete("1.0", tk.END)
        lyrics_text.insert(tk.END, song.lyrics)
    else:
        lyrics_text.delete("1.0", tk.END)
        lyrics_text.insert(tk.END, f"Sorry, lyrics for '{song_name}' not found.")

# designing UI
root = tk.Tk()
root.title("Lyricsify")
root.geometry("480x720") 
root.config(bg="#191414")

style = ttk.Style()
style.theme_create("spotify", parent="alt", settings={
    "TLabel": {
        "configure": {"background": "#191414", "foreground": "white"}
    },
    "TButton": {
        "configure": {
            "background": "#1DB954",
            "foreground": "white",
            "padding": 10,
            "font": ("Arial", 16),
            "borderwidth": 0,
        },
        "map": {
            "background": [("active", "#1ED760"), ("disabled", "grey")]
        }
    },
    "TEntry": {
        "configure": {
            "background": "white",
            "foreground": "black",
            "font": ("Arial", 16),
            "padding": 10,
            "borderwidth": 0,
        },
        "map": {
            "background": [("active", "#E6E6E6"), ("disabled", "grey")]
        }
    },
    "TText": {
        "configure": {
            "background": "#F2F2F2",
            "foreground": "black",
            "font": ("Arial", 12),
            "borderwidth": 0,
        }
    }
})
style.theme_use("spotify")

header_label = ttk.Label(root, text="Lyricsify", font=("Arial", 24), foreground="white", anchor="center")
header_label.pack(pady=20)

song_label = ttk.Label(root, text="Enter song name or lyrics snippet:", font=("Arial", 16))
song_label.pack(pady=10)

song_entry = ttk.Entry(root, font=("Arial", 16))
song_entry.pack(pady=10)

search_button = ttk.Button(root, text="Search", command=search_lyrics)
search_button.pack(pady=10)

lyrics_text = tk.Text(root, font=("Arial", 12))
lyrics_text.pack(fill=tk.BOTH, expand=True)

root.mainloop()
