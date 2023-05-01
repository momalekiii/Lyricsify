

# Lyricsify

Lyricsify is a Python application that uses the [Genius API](https://genius.com/developers) to search for and display song lyrics. It features a simple graphical user interface built with Tkinter and styled with the Spotify color scheme.

## Installation

To run Lyricsify, you'll need Python 3. Create new Python env

```bash
python -m venv env
```

Activate env

Linux
```bash
source env/bin/activate
```

Windows
```ps1
.\env\Scripts\Activate.ps1
```

Install Requirements

```bash
pip install -r requirements.txt
```

Rename .env.example to .env and add your Genuis token

## Usage

To use Lyricsify, simply run the `lyricsify.py` script in a terminal or command prompt. The graphical user interface will appear, prompting you to enter the name of a song. Once you click the "Search" button, Lyricsify will search for the lyrics to that song using the Genius API and display them in the text box.


## Credits

Lyricsify was created by @momalekiii and is licensed under the [MIT License](LICENSE.md). The app uses the [Genius API](https://genius.com/developers) to search for and display song lyrics. The Spotify color scheme was adapted from the [Tkinter-Designer](https://github.com/ParthJadhav/Tkinter-Designer) project.

## Contributing

If you'd like to contribute to Lyricsify, feel free to submit a pull request or open an issue.