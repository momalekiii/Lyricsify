(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const searchForm = $('#search-form');
  const searchInput = $('#search-input');
  const providerSelect = $('#provider-select');
  const resultsNode = $('#results');
  const searchResultsMenu = $('#search-results-menu');
  const resultsSlot = $('#results-slot');
  const detailNode = $('#detail');
  const emptyNode = $('#empty-state');
  const noticeNode = $('#notice');
  const snippetInput = $('#snippet-input');
  const lyricsNode = $('#lyrics-text');
  const selectedLyricLines = new Set();
  const savedKey = 'lyricsify.saved.v1';
  let currentSong = null;
  let currentResults = [];
  let activeSearch = 0;
  let cardFormat = 'post';
  let toastTimer;
  const artworkCache = new Map();
  const artworkAlbumCache = new Map();
  const artworkRequests = new Map();
  const artworkImageCache = new Map();
  let currentArtworkForCard = null;
  let currentArtworkSongId = null;
  let currentCoverRGB = null;
  const shareBlobCache = new Map();
  let shareBlobTimer;
  let searchDebounceTimer;

  const readSaved = () => {
    try {
      const value = JSON.parse(localStorage.getItem(savedKey) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  };
  let savedSongs = readSaved();

  const translations = {
    en: {
      yourSpace:'YOUR SPACE', discover:'Discover', savedSongs:'Saved songs', providerNote:'Two lyric sources, one little app.', about:'About',
      breadcrumb:'YOUR MUSIC, IN WORDS', findTheLine:'FIND THE LINE', heroTitle:'Songs say it<br><span>better.</span>',
      heroIntro:'Look up a song, find the words that hit, and make a little something worth sharing.',
      searchPrompt:'Search for a song or artist', searchPlaceholder:'Song or artist', allSources:'All sources', findLyrics:'Find lyrics', looking:'Searching…',
      tryExample:'Try', orWord:'or', suggestionDreams:'“Dreams” by Fleetwood Mac', suggestionGetLucky:'“Get Lucky” by Daft Punk',
      homeKicker:'A GOOD PLACE TO START', homeTitle:'Pick a song. Keep a line.', searchingKicker:'SEARCHING THE CATALOG',
      lookingFor:'Looking for', foundKicker:'FOUND IN THE CATALOG', oneMatch:'One song, one starting point.', manyMatches:'Which one sounds right?',
      noMatchKicker:'NO MATCH THIS TIME', noMatchTitle:'Try another way in.', noMatchHeading:'No lyrics found just yet.',
      noMatchCopy:'Check the spelling, try artist and title together, or choose a different source.',
      lyricsOvhHint:'For Lyrics.ovh, use “Artist - Song title” so we know exactly what to look up.',
      sourceError:'One or more sources could not be reached. Check your connection and try again.',
      rateLimitError:'The lyric service is busy. Wait a moment, then try again.',
      timeoutError:'The lyric sources took too long to respond. Please try again.',
      networkKicker:'A SMALL INTERNET MOMENT', networkTitle:'Couldn’t reach the lyric sources.',
      networkHeading:'Let’s try that again.', networkCopy:'Check your connection and search again in a moment.',
      lyricsKicker:'THE WORDS BEHIND THE MUSIC', lyricsTitle:'Pick a line. Make it yours.', lyricsWord:'LYRICS',
      lyricsUnavailable:'We found the song, but lyrics aren’t available from our lyric sources yet.', trackInfo:'TRACK INFO', trackInfoPrefix:'Track info: ', theLyrics:'THE LYRICS', selectTip:'Tap lines to select up to 5',
      makeItYours:'MAKE IT YOURS', snippetTitle:'A line worth keeping.',
      snippetIntro:'Select a lyric, or write your own excerpt below. Then turn it into a shareable card.',
      snippetPlaceholder:'Your favorite line will show up here…', cardMood:'CARD MOOD', moodLavender:'Lavender', moodRose:'Rose', moodMist:'Mist',
      shareCard:'Share card', instagram:'Instagram', story:'Story', post:'Post', postToX:'Post to X', downloadImage:'Download image', copyText:'Copy text',
      shareFootnote:'Your caption includes “by Lyricsify”. Choose Instagram Story/Post or X in your phone’s share sheet. If image sharing isn’t supported, the image downloads; X opens a prefilled composer and Instagram opens for manual upload.',
      emptyEyebrow:'YOUR NEXT FAVORITE LINE', emptyTitle:'It’s out there somewhere.',
      emptyIntro:'Search a title, an artist, or that half-remembered lyric stuck in your head.',
      savedKicker:'YOUR LITTLE COLLECTION', savedTitle:'Songs you wanted to keep.',
      savedEmptyTitle:'Nothing saved just yet.', savedEmptyCopy:'Find a song you love and tap the little heart to keep it close.',
      viewDiscover:'DISCOVER', viewSaved:'SAVED SONGS', savedCount:'SAVED', match:'MATCH', matches:'MATCHES',
      madeWithLove:'Made with love by', rightsFooter:'Lyrics and cover artwork remain the property of their respective owners.',
      sourceNote:'ABOUT LYRICSIFY', aboutTitle:'Lyricsify finds the lines that stay with you.',
      aboutSources:'Searches use <a href="https://lrclib.net" target="_blank" rel="noreferrer">LRCLIB</a> and <a href="https://lyrics.ovh" target="_blank" rel="noreferrer">Lyrics.ovh</a>. Availability depends on each source. We don’t store a central lyrics catalog; saved songs stay in this browser.',
      aboutArtwork:'Album artwork comes from Apple’s iTunes Search API. A CORS image proxy may be used to include the cover in share-card exports; artwork remains the property of its artists and rights holders.',
      aboutSharing:'Share cards are made on your device. On phones, use the share sheet to send the image and prefilled caption to X or Instagram. If image sharing is unavailable, X opens its composer with the text and the image downloads; Instagram opens for manual upload. You always confirm the post in the social app.',
      gotIt:'Got it', close:'Close', darkMode:'Dark mode', lightMode:'Light mode', switchToPersian:'Switch to Persian', switchToEnglish:'Switch to English',
      charCount:'{count} / 280 for X', searchSource:'Search provider', albumLabel:'Album', profileSpotify:'Find {artist} on Spotify', profileSoundcloud:'Find {artist} on SoundCloud',
      resultLabel:'{title} by {artist}, from {provider}', saveSong:'Save song', removeSaved:'Remove saved song', saveAction:'Save', savedAction:'Saved',
      shareTitle:'{title} by {artist}', shareCredit:'— {title} by {artist}', shareAppCredit:'— by Lyricsify', copyFormat:'“{snippet}” — {title} by {artist}', xSharePrefix:'A lyric I love: ', xComposerReady:'Opening X with your selected line.', xShareReady:'Share sheet opened with your lyric image and text. Choose X to post.', xImageFallback:'Your image is downloading; X is opening with your text. Attach the image before posting.', instagramShareReady:'Image sent to the share sheet. Finish posting in Instagram.',
      savedToast:'Saved for later.', removedToast:'Removed from your saved songs.', saveError:'Could not save in this browser.',
      emptySnippet:'Select a line or add a snippet first.', longSelection:'That’s a long one — trimmed to 500 characters.', tooManyLines:'You can select up to 5 lines. Remove one to choose another.',
      imageError:'Couldn’t make the image. Try another browser.', cardReady:'Your lyric card is ready.',
      copied:'Snippet copied with song credit.', copyFailed:'Couldn’t copy automatically — select and copy the text.',
      sharingFailed:'Sharing unavailable — image downloaded.', sourceAttribution:' · lyrics are owned by their respective writers and publishers.',
      sourcePrefix:'Source: ',
      instagramStoryDownloaded:'Instagram Story image downloaded — ready to share.', instagramPostDownloaded:'Instagram Post image downloaded — ready to share.',
    },
    fa: {
      yourSpace:'گوشهٔ تو', discover:'خانه', savedSongs:'آهنگای ذخیره‌شده', providerNote:'دو تا منبع ترانه، یه جا.', about:'درباره‌مون',
      breadcrumb:'موسیقی و حرفایی که می‌مونه', findTheLine:'اون مصرعو پیدا کن', heroTitle:'بعضی آهنگا<br><span>به‌جات حرف می‌زنن.</span>',
      heroIntro:'اسم آهنگو پیدا کن، اون تیکه‌ای که به دلت نشست رو بردار و با بقیه شریک شو.',
      searchPrompt:'جست‌وجوی آهنگ یا خواننده', searchPlaceholder:'اسم آهنگ یا خواننده', allSources:'همهٔ منبع‌ها', findLyrics:'بگرد', looking:'در حال جست‌وجو…',
      tryExample:'مثلاً', orWord:'یا', suggestionDreams:'Mehrad Hidden - Dardesar', suggestionGetLucky:'Ghatle amd by Dorcci',
      homeKicker:'از اینجا شروع کنیم', homeTitle:'یه آهنگ پیدا کن، یه مصرع نگه دار.', searchingKicker:'داریم بین آهنگا می‌گردیم',
      lookingFor:'دنبال', foundKicker:'اینارو پیدا کردیم', oneMatch:'یه آهنگ پیدا شد، از اینجا شروع کنیم.', manyMatches:'کدومش همونیه که می‌خوای؟',
      noMatchKicker:'این یکی پیدا نشد', noMatchTitle:'یه جور دیگه بگردیم؟', noMatchHeading:'هنوز چیزی پیدا نکردیم.',
      noMatchCopy:'اسم آهنگ یا خواننده رو یه جور دیگه بنویس، یا یه منبع دیگه رو امتحان کن.',
      lyricsOvhHint:'برای Lyrics.ovh این‌جوری بنویس: «خواننده - اسم آهنگ».',
      sourceError:'به یکی از منبع‌ها وصل نشدیم. اینترنت رو چک کن و دوباره بزن.',
      rateLimitError:'منبع ترانه فعلاً شلوغه؛ یه کم صبر کن و دوباره بزن.',
      timeoutError:'منبع‌ها دیر جواب دادن؛ یه بار دیگه امتحان کن.',
      networkKicker:'اینترنت یه لحظه قاطی کرد', networkTitle:'الان به منبع ترانه وصل نمی‌شیم.',
      networkHeading:'دوباره امتحان کنیم؟', networkCopy:'اینترنت رو چک کن و چند لحظه دیگه دوباره بگرد.',
      lyricsKicker:'حرفایی که توی آهنگا می‌مونه', lyricsTitle:'یه مصرع انتخاب کن، برای خودت نگهش دار.', lyricsWord:'متن ترانه',
      lyricsUnavailable:'آهنگ رو پیدا کردیم، ولی متنش فعلاً توی منبع‌های ما نیست.', trackInfo:'جزئیات آهنگ', trackInfoPrefix:'اطلاعات آهنگ: ', theLyrics:'متن ترانه', selectTip:'برای انتخاب، روی خط‌ها بزن؛ تا ۵ خط',
      makeItYours:'مال خودت کن', snippetTitle:'یه خط که به دل می‌شینه.',
      snippetIntro:'یه تیکه از ترانه رو انتخاب کن یا خودت بنویس؛ بعد ازش یه کارت بساز و بفرست.',
      snippetPlaceholder:'اون مصرعی که دوست داری…', cardMood:'حال‌وهوای کارت', moodLavender:'یاسی', moodRose:'رز', moodMist:'مه‌آلود',
      shareCard:'کارتو بفرست', instagram:'اینستاگرام', story:'استوری', post:'پست', postToX:'بفرست توی X', downloadImage:'دانلود تصویر', copyText:'کپی متن',
      shareFootnote:'کپشن با عبارت «با Lyricsify» آماده می‌شه. از منوی گوشیت استوری/پست اینستاگرام یا X رو انتخاب کن. اگر تصویر قابل‌اشتراک‌گذاری نبود، دانلود می‌شه.',
      emptyEyebrow:'مصرع بعدیِ محبوبت', emptyTitle:'یه جایی منتظرته.',
      emptyIntro:'اسم آهنگ یا خواننده رو بزن، یا همون تیکه‌ای که از ذهنت بیرون نمی‌ره.',
      savedKicker:'گوشهٔ آهنگای تو', savedTitle:'آهنگایی که نگه داشتی.',
      savedEmptyTitle:'هنوز چیزی نگه نداشتی.', savedEmptyCopy:'یه آهنگ پیدا کن و قلبشو بزن تا اینجا بمونه.',
      viewDiscover:'خانه', viewSaved:'ذخیره‌شده‌ها', savedCount:'تا', match:'نتیجه', matches:'نتیجه',
      madeWithLove:'با عشق ساخته شده توسط', rightsFooter:'ترانه‌ها و عکس جلد مال صاحب‌هاشونه.',
      sourceNote:'دربارهٔ Lyricsify', aboutTitle:'Lyricsify مصرع‌هایی رو پیدا می‌کنه که باهات می‌مونن.',
      aboutSources:'برای جست‌وجو از <a href="https://lrclib.net" target="_blank" rel="noreferrer">LRCLIB</a> و <a href="https://lyrics.ovh" target="_blank" rel="noreferrer">Lyrics.ovh</a> کمک می‌گیریم. پیدا شدن آهنگ به منبعش بستگی داره. آهنگ‌های ذخیره‌شده فقط توی همین مرورگر می‌مونن.',
      aboutArtwork:'عکس جلد از جست‌وجوی موسیقی Apple میاد. برای گذاشتنش روی کارت ممکنه تصویر از یه پراکسی سازگار با CORS رد بشه؛ عکس مال هنرمندها و صاحبان حقشه.',
      aboutSharing:'کارت روی گوشی یا کامپیوتر خودت ساخته می‌شه. روی گوشی از منوی اشتراک‌گذاری، تصویر و کپشن آماده رو به X یا اینستاگرام بفرست. اگه نشد، متن آماده توی X باز می‌شه و تصویر دانلود می‌شه؛ اینستاگرام رو هم برای بارگذاری دستی باز می‌کنیم. انتشار رو همیشه خودت توی برنامهٔ شبکهٔ اجتماعی تأیید می‌کنی.',
      gotIt:'باشه', close:'بستن', darkMode:'تم تیره', lightMode:'تم روشن', switchToPersian:'رفتن به فارسی', switchToEnglish:'برگشت به انگلیسی',
      charCount:'{count} / ۲۸۰ برای X', searchSource:'منبع جست‌وجو', albumLabel:'آلبوم', profileSpotify:'پیدا کردن {artist} توی Spotify', profileSoundcloud:'پیدا کردن {artist} توی SoundCloud',
      resultLabel:'{title} از {artist} · {provider}', saveSong:'ذخیرهٔ آهنگ', removeSaved:'برداشتن از ذخیره‌شده‌ها', saveAction:'ذخیره', savedAction:'ذخیره شد',
      shareTitle:'{title} از {artist}', shareCredit:'— {title} از {artist}', shareAppCredit:'— با Lyricsify', copyFormat:'«{snippet}» — {title} از {artist}', xSharePrefix:'یه مصرع که دوستش دارم: ', xComposerReady:'پست با مصرعت رو توی X باز می‌کنیم.', xShareReady:'منوی اشتراک‌گذاری با تصویر و متن باز شد؛ X رو برای انتشار انتخاب کن.', xImageFallback:'تصویر داره دانلود می‌شه و متن در X باز می‌شه؛ قبل از انتشار، تصویر رو ضمیمه کن.', instagramShareReady:'تصویر به منوی اشتراک‌گذاری فرستاده شد؛ انتشارش رو توی اینستاگرام کامل کن.',
      savedToast:'باشه، برای بعد نگهش داشتیم.', removedToast:'از آهنگای ذخیره‌شده برداشتیم.', saveError:'توی این مرورگر ذخیره نشد.',
      emptySnippet:'اول یه مصرع انتخاب کن یا بنویس.', longSelection:'این یکی طولانی بود؛ تا ۵۰۰ نویسه کوتاهش کردیم.', tooManyLines:'حداکثر ۵ خط؛ برای انتخاب خط تازه، اول یکی رو بردار.',
      imageError:'تصویر ساخته نشد؛ با یه مرورگر دیگه امتحان کن.', cardReady:'کارتت آماده‌ست.',
      copied:'متن و اسم آهنگ کپی شد.', copyFailed:'کپی نشد؛ خودت متن رو انتخاب و کپی کن.',
      sharingFailed:'اشتراک‌گذاری نشد؛ تصویر رو دانلود کردیم.', sourceAttribution:' · متن ترانه مال نویسنده‌ها و ناشرهاشه.',
      sourcePrefix:'منبع: ',
      instagramStoryDownloaded:'تصویر استوری دانلود شد، آمادهٔ فرستادنه.', instagramPostDownloaded:'تصویر پست دانلود شد، آمادهٔ فرستادنه.',
    },
  };

  let currentLanguage = 'en';
  try { currentLanguage = localStorage.getItem('lyricsify.language.v1') === 'fa' ? 'fa' : 'en'; } catch (_) { /* storage is optional */ }
  let viewMode = 'home';
  let emptyMode = 'home';

  function t(key) {
    return (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key;
  }

  function interpolate(template, values = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  }

  function localizedNumber(value) {
    return currentLanguage === 'fa' ? String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]) : String(value);
  }

  function updateSectionText() {
    document.documentElement.dataset.view = viewMode;
    const kicker = $('#section-kicker');
    const title = $('#section-title');
    const query = searchInput.value.trim();
    const strings = {
      home: ['homeKicker', 'homeTitle'],

      searching: ['searchingKicker', null],
      results: ['foundKicker', currentResults.length === 1 ? 'oneMatch' : 'manyMatches'],
      detail: ['lyricsKicker', 'lyricsTitle'],
      'no-results': ['noMatchKicker', 'noMatchTitle'],
      'network-error': ['networkKicker', 'networkTitle'],
      saved: ['savedKicker', savedSongs.length ? 'savedTitle' : 'savedTitleEmpty'],
    };
    const [kickerKey, titleKey] = strings[viewMode] || strings.home;
    kicker.textContent = t(kickerKey);
    if (viewMode === 'searching') title.textContent = `${t('lookingFor')} “${query}”`;
    else if (viewMode === 'saved' && !savedSongs.length) title.textContent = t('savedEmptyTitle');
    else title.textContent = t(titleKey);
    const viewLabel = $('#view-label');
    if (viewLabel) viewLabel.textContent = viewMode === 'saved' ? t('viewSaved') : t('viewDiscover');
    const count = $('#result-count');
    const savedCount = $('#saved-result-count');
    const menuTitle = $('#search-menu-title');
    count.textContent = (viewMode === 'results' || viewMode === 'detail') && currentResults.length
      ? `${localizedNumber(currentResults.length)} ${t(currentResults.length === 1 ? 'match' : 'matches')}` : '';
    savedCount.textContent = viewMode === 'saved' && savedSongs.length
      ? `${localizedNumber(savedSongs.length)} ${t('savedCount')}` : '';
    menuTitle.textContent = viewMode === 'searching'
      ? `${t('lookingFor')} “${query}”`
      : viewMode === 'results' ? t(currentResults.length === 1 ? 'oneMatch' : 'manyMatches') : '';
  }

  function updateEmptyText() {
    const heading = $('#empty-state h3');
    const copy = $('#empty-state p');
    const keys = {
      home: ['emptyTitle', 'emptyIntro'],
      'no-results': [providerSelect.value === 'lyricsovh' && !splitArtistTitle(searchInput.value.trim()) ? 'noMatchHeading' : 'noMatchHeading', providerSelect.value === 'lyricsovh' && !splitArtistTitle(searchInput.value.trim()) ? 'lyricsOvhHint' : 'noMatchCopy'],
      'network-error': ['networkHeading', 'networkCopy'],
      'saved-empty': ['savedEmptyTitle', 'savedEmptyCopy'],
    }[emptyMode] || ['emptyTitle', 'emptyIntro'];
    heading.textContent = t(keys[0]);
    copy.textContent = t(keys[1]);
  }

  function applyLanguage(language) {
    currentLanguage = language === 'fa' ? 'fa' : 'en';
    const persian = currentLanguage === 'fa';
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = persian ? 'rtl' : 'ltr';
    document.title = persian ? 'Lyricsify — مصرعی برای تو' : 'Lyricsify — find the line';
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = t(node.dataset.i18n);
      if (value) node.textContent = value;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((node) => { node.innerHTML = t(node.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
    const sampleButtons = document.querySelectorAll('.suggestion');
    if (sampleButtons[0]) sampleButtons[0].dataset.query = persian ? 'Mehrad Hidden - Dardesar' : 'Dreams Fleetwood Mac';
    if (sampleButtons[1]) sampleButtons[1].dataset.query = persian ? 'Ghatle amd by Dorcci' : 'Daft Punk Get Lucky';
    const languageButton = $('#language-toggle');
    languageButton.textContent = persian ? 'FA' : 'EN';
    $('#about-button').title = t('about');
    languageButton.setAttribute('aria-label', t(persian ? 'switchToEnglish' : 'switchToPersian'));
    languageButton.title = t(persian ? 'switchToEnglish' : 'switchToPersian');
    $('#theme-toggle .theme-label').textContent = t(document.documentElement.dataset.theme === 'dark' ? 'darkMode' : 'lightMode');
    $('#search-input').setAttribute('aria-label', t('searchPlaceholder'));
    $('#provider-select').setAttribute('aria-label', t('searchSource'));
    $('#search-input').dir = 'auto';
    snippetInput.dir = 'auto';
    $('#lyrics-text').dir = 'auto';
    $('#saved-count').textContent = localizedNumber(savedSongs.length);
    updateSectionText();
    updateEmptyText();
    updateSnippetCount();
    if (currentSong) {
      updateFavoriteButton();
      updateSongLanguageText();
      updateAlbumDetails(currentSong);
    }
    if (currentLanguage === 'fa' && document.fonts && document.fonts.load) {
      document.fonts.load('500 20px Vazirmatn').then(() => {
        if (currentSong && snippetInput.value.trim()) drawCard(cardFormat);
      }).catch(() => {});
    }
  }

  function toast(message, variant = 'info') {
    const node = $('#toast');
    node.textContent = message;
    node.classList.toggle('error', variant === 'error');
    node.setAttribute('role', variant === 'error' ? 'alert' : 'status');
    node.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 3200);
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = dark ? '#121212' : '#f7f7f7';
    const button = $('#theme-toggle');
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', t(dark ? 'lightMode' : 'darkMode'));
    const label = button.querySelector('.theme-label');
    if (label) label.textContent = t(dark ? 'darkMode' : 'lightMode');
  }

  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('lyricsify.theme.v1') || 'dark'; } catch (_) { /* storage is optional */ }
  applyTheme(savedTheme);
  applyLanguage(currentLanguage);

  function moveResultsToSearchMenu() {
    if (resultsNode.parentElement !== searchResultsMenu) searchResultsMenu.append(resultsNode);
  }

  function moveResultsToSavedSlot() {
    if (resultsNode.parentElement !== resultsSlot) resultsSlot.append(resultsNode);
  }

  function setSearchResultsOpen(open) {
    searchResultsMenu.hidden = !open;
    searchInput.setAttribute('aria-expanded', String(open));
  }

  function setNotice(message = '') {
    noticeNode.textContent = message;
    noticeNode.hidden = !message;
  }

  function setBusy(busy) {
    $('.results-section').setAttribute('aria-busy', String(busy));
    searchInput.setAttribute('aria-busy', String(busy));
  }

  function normalizeSong(song) {
    const lyrics = song.lyrics || song.plainLyrics || stripTimestamps(song.syncedLyrics || '');
    return {
      id: `${song.provider || 'lrclib'}:${song.id ?? `${song.artistName || song.artist || ''}:${song.trackName || song.title || ''}`}`,
      title: song.trackName || song.title || 'Untitled song',
      artist: song.artistName || song.artist || 'Unknown artist',
      album: song.albumName || song.album || '',
      artworkUrl: song.artworkUrl || song.artworkUrl100 || '',
      duration: Number(song.duration || (song.trackTimeMillis ? song.trackTimeMillis / 1000 : 0)) || 0,
      lyrics,
      provider: song.provider || 'LRCLIB',
      sourceUrl: song.sourceUrl || (song.provider === 'Lyrics.ovh' ? 'https://lyrics.ovh' : 'https://lrclib.net'),
      instrumental: Boolean(song.instrumental),
    };
  }

  function stripTimestamps(text) {
    return text.replace(/^\s*\[[0-9:.]+\]\s?/gm, '').trim();
  }

  function splitArtistTitle(query) {
    const match = query.match(/^\s*(.+?)\s+(?:-|–|—|\|)\s+(.+?)\s*$/);
    if (match) return { artist: match[1].trim(), title: match[2].trim() };
    const byMatch = query.match(/^\s*(.+?)\s+by\s+(.+?)\s*$/i);
    if (byMatch) return { title: byMatch[1].trim(), artist: byMatch[2].trim() };
    return null;
  }

  async function fetchJson(url, extraHeaders = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', ...extraHeaders },
      });
      if (!response.ok) {
        const error = new Error(response.status === 404 ? 'No match found.' : `Source returned ${response.status}.`);
        error.status = response.status;
        error.retryAfter = response.headers.get('Retry-After');
        throw error;
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  function fetchItunesJsonp(term) {
    return new Promise((resolve, reject) => {
      const callbackName = `__lyricsify_itunes_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        script.remove();
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      };
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback(value);
      };
      const timer = setTimeout(() => finish(reject, new Error('Artwork lookup timed out.')), 9000);
      window[callbackName] = (data) => finish(resolve, data);
      script.onerror = () => finish(reject, new Error('Artwork lookup failed.'));
      script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=12&callback=${callbackName}`;
      document.head.append(script);
    });
  }

  async function findArtwork(song) {
    const key = `${song.artist.toLocaleLowerCase()}|${song.title.toLocaleLowerCase()}`;
    if (song.artworkUrl && !artworkCache.get(key)) {
      const artwork = song.artworkUrl.replace(/100x100bb/i, '600x600bb');
      artworkCache.set(key, artwork);
      artworkAlbumCache.set(key, song.album || '');
      return artwork;
    }
    if (artworkCache.has(key)) {
      song.album ||= artworkAlbumCache.get(key) || '';
      return artworkCache.get(key);
    }
    if (artworkRequests.has(key)) {
      const artwork = await artworkRequests.get(key);
      song.album ||= artworkAlbumCache.get(key) || '';
      return artwork;
    }
    const request = (async () => {
      try {
        const term = `${song.artist} ${song.title}`;
        let data;
        try {
          data = await fetchItunesJsonp(term);
        } catch (_) {
          data = await fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=12`);
        }
        const normalize = (value) => (value || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const expectedTitle = normalize(song.title);
        const expectedArtist = normalize(song.artist);
        let best = null;
        let bestScore = -1;
        for (const track of data.results || []) {
          if (!track.artworkUrl100 || !track.trackName) continue;
          const title = normalize(track.trackName);
          const artist = normalize(track.artistName);
          const titleScore = title === expectedTitle ? 4 : (title.includes(expectedTitle) || expectedTitle.includes(title) ? 2 : 0);
          const artistScore = artist === expectedArtist ? 3 : (artist.includes(expectedArtist) || expectedArtist.includes(artist) ? 1 : 0);
          const score = titleScore + artistScore;
          if (titleScore && score > bestScore) { best = track; bestScore = score; }
        }
        const artwork = best ? best.artworkUrl100.replace(/100x100bb/i, '600x600bb') : null;
        const album = best && best.collectionName ? best.collectionName : '';
        artworkAlbumCache.set(key, album);
        song.album ||= album;
        artworkCache.set(key, artwork);
        return artwork;
      } catch (_) {
        artworkCache.set(key, null);
        return null;
      } finally {
        artworkRequests.delete(key);
      }
    })();
    artworkRequests.set(key, request);
    return request;
  }

  async function loadArtworkImage(song) {
    const key = `${song.artist.toLocaleLowerCase()}|${song.title.toLocaleLowerCase()}`;
    if (artworkImageCache.has(key)) {
      const cachedImage = await artworkImageCache.get(key);
      if (cachedImage || !song.artworkUrl) return cachedImage;
      artworkImageCache.delete(key);
    }
    const task = findArtwork(song).then(async (url) => {
      if (!url) return null;
      const load = (source) => new Promise((resolve) => {
        const image = new Image();
        const timer = setTimeout(() => { image.src = ''; resolve(null); }, 4500);
        image.crossOrigin = 'anonymous';
        image.onload = () => { clearTimeout(timer); resolve(image); };
        image.onerror = () => { clearTimeout(timer); resolve(null); };
        image.src = source;
      });
      const direct = await load(url);
      if (direct) return direct;
      // A CORS-enabled image proxy keeps the canvas exportable on CDN responses without CORS headers.
      const source = new URL(url);
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(`${source.host}${source.pathname}`)}&w=600&h=600&fit=cover`;
      return load(proxyUrl);
    }).catch(() => null);
    artworkImageCache.set(key, task);
    return task;
  }

  async function searchLrclib(query) {
    const clientHeaders = { 'Lrclib-Client': 'Lyricsify/1.0.0 (https://github.com/momalekiii/Lyricsify)' };
    const parts = splitArtistTitle(query);
    if (parts) {
      const exactUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(parts.title)}&artist_name=${encodeURIComponent(parts.artist)}`;
      try {
        const exact = await fetchJson(exactUrl, clientHeaders);
        if (exact && (exact.plainLyrics || exact.syncedLyrics)) return [normalizeSong({ ...exact, provider: 'LRCLIB' })];
      } catch (error) {
        // Respect LRCLIB throttling; otherwise continue to its broader search endpoint.
        if (error.status === 429) throw error;
      }
    }
    const searchUrl = parts
      ? `https://lrclib.net/api/search?track_name=${encodeURIComponent(parts.title)}&artist_name=${encodeURIComponent(parts.artist)}`
      : `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const rows = await fetchJson(searchUrl, clientHeaders);
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => row && (row.plainLyrics || row.syncedLyrics)).map((row) => normalizeSong({ ...row, provider: 'LRCLIB' }));
  }

  async function searchLrclibBySignature(song) {
    if (!song.duration) return null;
    const params = new URLSearchParams({ track_name: song.title, artist_name: song.artist });
    if (song.album) params.set('album_name', song.album);
    params.set('duration', String(Math.round(song.duration)));
    try {
      const result = await fetchJson(`https://lrclib.net/api/get?${params}`, {
        'Lrclib-Client': 'Lyricsify/1.0.0 (https://github.com/momalekiii/Lyricsify)',
      });
      return result && (result.plainLyrics || result.syncedLyrics)
        ? normalizeSong({ ...result, provider: 'LRCLIB' })
        : null;
    } catch (error) {
      if (error.status === 429) throw error;
      return null;
    }
  }

  async function searchLyricsOvh(query) {
    const parts = splitArtistTitle(query);
    if (!parts) return [];
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(parts.artist)}/${encodeURIComponent(parts.title)}`;
    const data = await fetchJson(url);
    if (!data || !data.lyrics || !data.lyrics.trim()) return [];
    return [normalizeSong({ artist: parts.artist, title: parts.title, lyrics: data.lyrics.trim(), provider: 'Lyrics.ovh' })];
  }

  async function searchAppleCatalog(query) {
    const parts = splitArtistTitle(query);
    const term = parts ? `${parts.title} ${parts.artist}` : query;
    let data;
    try {
      data = await fetchItunesJsonp(term);
    } catch (_) {
      data = await fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=12`);
    }
    const normalize = (value) => (value || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const wantedTitle = parts ? normalize(parts.title) : '';
    const wantedArtist = parts ? normalize(parts.artist) : '';
    const matches = (data.results || []).filter((track) => {
      if (!track.trackName || !track.artistName) return false;
      if (!parts) return true;
      const title = normalize(track.trackName);
      const artist = normalize(track.artistName);
      return (title.includes(wantedTitle) || wantedTitle.includes(title))
        && (artist.includes(wantedArtist) || wantedArtist.includes(artist));
    });
    return matches.slice(0, 8).map((track) => normalizeSong({
      id: track.trackId,
      trackName: track.trackName,
      artistName: track.artistName,
      albumName: track.collectionName,
      artworkUrl: track.artworkUrl100,
      duration: track.trackTimeMillis ? track.trackTimeMillis / 1000 : 0,
      sourceUrl: track.trackViewUrl || 'https://music.apple.com',
      provider: 'Apple Music',
      lyrics: '',
    }));
  }

  async function performSearch(query, provider = 'all') {
    const searchId = ++activeSearch;
    resetCoverTheme();
    setBusy(true);
    setNotice('');
    moveResultsToSearchMenu();
    resultsNode.replaceChildren();
    resultsNode.hidden = true;
    setSearchResultsOpen(true);
    $('#search-menu-status').textContent = t('looking');
    $('#search-menu-status').hidden = false;
    detailNode.hidden = true;
    emptyNode.hidden = true;
    $('#result-count').textContent = '';
    viewMode = 'searching';
    updateSectionText();
    try {
      let rows = [];
      const tasks = [];
      if (provider === 'all' || provider === 'lrclib') tasks.push(searchLrclib(query).catch((error) => ({ error })));
      if (provider === 'all' || provider === 'lyricsovh') tasks.push(searchLyricsOvh(query).catch((error) => ({ error })));
      const responses = await Promise.all(tasks);
      if (searchId !== activeSearch) return;
      const errors = responses.filter((response) => response && response.error).map((response) => response.error);
      rows = responses.flatMap((response) => Array.isArray(response) ? response : []);
      const unique = new Map();
      for (const song of rows) {
        const key = `${song.title.toLocaleLowerCase()}|${song.artist.toLocaleLowerCase()}`;
        if (!unique.has(key) || (!unique.get(key).lyrics && song.lyrics)) unique.set(key, song);
      }
      currentResults = [...unique.values()];
      const requestedTrack = splitArtistTitle(query);
      const normalize = (value) => (value || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const hasRequestedTrack = requestedTrack && currentResults.some((song) => {
        const title = normalize(song.title), artist = normalize(song.artist);
        const wantedTitle = normalize(requestedTrack.title), wantedArtist = normalize(requestedTrack.artist);
        return (title.includes(wantedTitle) || wantedTitle.includes(title))
          && (artist.includes(wantedArtist) || wantedArtist.includes(artist));
      });
      if (!currentResults.length || (requestedTrack && !hasRequestedTrack)) {
        const catalogResults = await searchAppleCatalog(query).catch(() => []);
        if (searchId !== activeSearch) return;
        if (requestedTrack && catalogResults.length && !errors.some((error) => error.status === 429)) {
          const recoveredLyrics = await searchLrclibBySignature(catalogResults[0]).catch((error) => {
            errors.push(error);
            return null;
          });
          if (searchId !== activeSearch) return;
          if (recoveredLyrics) {
            const matchIndex = catalogResults.findIndex((song) => normalize(song.title) === normalize(recoveredLyrics.title)
              && normalize(song.artist) === normalize(recoveredLyrics.artist));
            if (matchIndex >= 0) {
              const metadata = catalogResults[matchIndex];
              catalogResults[matchIndex] = {
                ...metadata,
                ...recoveredLyrics,
                album: recoveredLyrics.album || metadata.album,
                artworkUrl: metadata.artworkUrl,
                duration: recoveredLyrics.duration || metadata.duration,
              };
            }
          }
        }
        const merged = new Map();
        for (const song of [...catalogResults, ...currentResults]) {
          const key = `${song.title.toLocaleLowerCase()}|${song.artist.toLocaleLowerCase()}`;
          if (!merged.has(key) || (!merged.get(key).lyrics && song.lyrics)) merged.set(key, song);
        }
        currentResults = [...merged.values()];
      }
      if (!currentResults.length) {
        setSearchResultsOpen(false);
        $('#search-menu-status').hidden = true;
        viewMode = 'no-results';
        emptyMode = 'no-results';
        updateSectionText();
        updateEmptyText();
        emptyNode.hidden = false;
        if (errors.some((error) => error.status === 429)) setNotice(t('rateLimitError'));
        else if (errors.length && errors.every((error) => error.name === 'AbortError')) setNotice(t('timeoutError'));
        else if (errors.length) setNotice(t('sourceError'));
        return;
      }
      if (errors.some((error) => error.status === 429) && !currentResults.some((song) => song.lyrics)) setNotice(t('rateLimitError'));
      viewMode = 'results';
      updateSectionText();
      $('#search-menu-status').hidden = true;
      renderResults(currentResults);
      setSearchResultsOpen(currentResults.length > 0);
    } catch (error) {
      if (searchId !== activeSearch) return;
      setSearchResultsOpen(false);
      $('#search-menu-status').hidden = true;
      viewMode = 'network-error';
      emptyMode = 'network-error';
      updateSectionText();
      updateEmptyText();
      emptyNode.hidden = false;
      setNotice(error.name === 'AbortError' ? t('timeoutError') : t('sourceError'));
    } finally {
      if (searchId === activeSearch) setBusy(false);
    }
  }

  function renderResults(songs) {
    resultsNode.replaceChildren();
    resultsNode.hidden = false;
    songs.forEach((song, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'result-card';
      button.style.setProperty('--card-delay', `${Math.min(index, 10) * 42}ms`);
      button.setAttribute('aria-label', interpolate(t('resultLabel'), { title: song.title, artist: song.artist, provider: song.provider }));
      const cover = document.createElement('span');
      cover.className = 'result-cover';
      const coverImage = document.createElement('img');
      coverImage.alt = '';
      coverImage.hidden = true;
      coverImage.addEventListener('error', () => { coverImage.hidden = true; });
      cover.append(coverImage);
      if (index < 12) {
        findArtwork(song).then((artwork) => {
          if (artwork && button.isConnected) {
            coverImage.src = artwork;
            coverImage.hidden = false;
          }
        });
      }
      const info = document.createElement('span');
      info.className = 'result-info';
      const title = document.createElement('strong');
      title.textContent = song.title;
      const artist = document.createElement('span');
      artist.textContent = `${song.artist} · ${song.provider}`;
      info.append(title, artist);
      button.append(cover, info);
      button.addEventListener('click', () => showSong(song));
      resultsNode.append(button);
    });
  }

  function resetCoverTheme() {
    currentCoverRGB = null;
    document.documentElement.style.removeProperty('--cover-glow-light');
    document.documentElement.style.removeProperty('--cover-glow-dark');
  }

  function applyCoverTheme(image) {
    if (!image || !image.naturalWidth) {
      resetCoverTheme();
      return;
    }
    try {
      const sample = document.createElement('canvas');
      sample.width = 18;
      sample.height = 18;
      const context = sample.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      let red = 0, green = 0, blue = 0, count = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] < 128) continue;
        red += pixels[index]; green += pixels[index + 1]; blue += pixels[index + 2]; count += 1;
      }
      if (!count) return resetCoverTheme();
      const soften = (value) => Math.round((value / count) * .82 + 128 * .18);
      currentCoverRGB = [soften(red), soften(green), soften(blue)];
      const rgb = currentCoverRGB.join(', ');
      document.documentElement.style.setProperty('--cover-glow-light', `rgba(${rgb}, .30)`);
      document.documentElement.style.setProperty('--cover-glow-dark', `rgba(${rgb}, .36)`);
    } catch (_) {
      resetCoverTheme();
    }
  }

  function updateAlbumDetails(song) {
    const albumNode = $('#detail-album');
    albumNode.textContent = song.album ? `${t('albumLabel')}: ${song.album}` : '';
    albumNode.hidden = !song.album;
  }

  function clearLyricLineSelection() {
    selectedLyricLines.clear();
    lyricsNode.querySelectorAll('.lyric-line.is-selected').forEach((line) => {
      line.classList.remove('is-selected');
      line.setAttribute('aria-pressed', 'false');
    });
  }

  function renderLyricLines(song) {
    lyricsNode.replaceChildren();
    selectedLyricLines.clear();
    if (!song.lyrics || !song.lyrics.trim()) {
      const message = document.createElement('p');
      message.className = 'lyrics-unavailable';
      message.textContent = t('lyricsUnavailable');
      lyricsNode.append(message);
      return;
    }
    song.lyrics.split(/\r\n?|\n/).forEach((text, index) => {
      if (!text.trim()) {
        const gap = document.createElement('div');
        gap.className = 'lyric-gap';
        gap.setAttribute('aria-hidden', 'true');
        lyricsNode.append(gap);
        return;
      }
      const line = document.createElement('button');
      line.type = 'button';
      line.className = 'lyric-line';
      line.dataset.lineIndex = String(index);
      line.textContent = text;
      line.setAttribute('aria-pressed', 'false');
      line.setAttribute('aria-label', text);
      lyricsNode.append(line);
    });
  }

  function toggleLyricLine(line) {
    if (!currentSong || !currentSong.lyrics) return;
    const index = Number(line.dataset.lineIndex);
    if (selectedLyricLines.has(index)) selectedLyricLines.delete(index);
    else if (selectedLyricLines.size >= 5) {
      toast(t('tooManyLines'), 'error');
      return;
    } else selectedLyricLines.add(index);
    const selected = selectedLyricLines.has(index);
    line.classList.toggle('is-selected', selected);
    line.setAttribute('aria-pressed', String(selected));
    const lines = currentSong.lyrics.split(/\r\n?|\n/);
    snippetInput.value = [...selectedLyricLines].sort((a, b) => a - b).map((lineIndex) => lines[lineIndex]).join('\n');
    updateSnippetCount();
  }

  function showSong(song) {
    currentSong = song;
    viewMode = 'detail';
    updateSectionText();
    detailNode.hidden = false;
    emptyNode.hidden = true;
    setSearchResultsOpen(false);
    resultsNode.hidden = true;
    $('#detail-title').textContent = song.title;
    $('#detail-artist').textContent = song.artist;
    updateAlbumDetails(song);
    const artistLinks = $('#artist-links');
    artistLinks.replaceChildren();
    const artistQuery = encodeURIComponent(song.artist);
    [
      { name: 'Spotify', url: `https://open.spotify.com/search/${artistQuery}/artists` },
      { name: 'SoundCloud', url: `https://soundcloud.com/search/people?q=${artistQuery}` },
    ].forEach((service) => {
      const profileLink = document.createElement('a');
      profileLink.href = service.url;
      profileLink.target = '_blank';
      profileLink.rel = 'noreferrer';
      profileLink.textContent = service.name;
      profileLink.setAttribute('aria-label', interpolate(t(service.name === 'Spotify' ? 'profileSpotify' : 'profileSoundcloud'), { artist: song.artist }));
      artistLinks.append(profileLink);
    });
    renderLyricLines(song);
    const coverImage = $('#detail-cover');
    coverImage.hidden = true;
    coverImage.removeAttribute('src');
    coverImage.onerror = () => { coverImage.hidden = true; };
    currentArtworkForCard = null;
    currentArtworkSongId = song.id;
    findArtwork(song).then((artwork) => {
      if (currentSong && currentSong.id === song.id) {
        updateAlbumDetails(song);
        if (artwork) {
          coverImage.src = artwork;
          coverImage.hidden = false;
        }
        if (snippetInput.value.trim()) drawCard(cardFormat);
      }
    });
    loadArtworkImage(song).then((image) => {
      if (currentSong && currentSong.id === song.id) {
        currentArtworkForCard = image;
        applyCoverTheme(image);
        if (snippetInput.value.trim()) drawCard(cardFormat);
      }
    });
    updateSongLanguageText();
    snippetInput.value = '';
    cardFormat = 'post';
    updateSnippetCount();
    updateFavoriteButton();
    detailNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updateSongLanguageText() {
    if (!currentSong) return;
    const hasLyrics = Boolean(currentSong.lyrics && currentSong.lyrics.trim());
    if (!hasLyrics) renderLyricLines(currentSong);
    $('#detail-source').textContent = `${currentSong.provider.toUpperCase()} · ${t(hasLyrics ? 'lyricsWord' : 'trackInfo')}`;
    const attribution = $('#attribution');
    attribution.replaceChildren(document.createTextNode(t(hasLyrics ? 'sourcePrefix' : 'trackInfoPrefix')));
    const link = document.createElement('a');
    link.href = currentSong.sourceUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = currentSong.provider;
    attribution.append(link);
    if (hasLyrics) attribution.append(document.createTextNode(t('sourceAttribution')));
    document.querySelectorAll('#artist-links a').forEach((profileLink) => {
      const service = profileLink.textContent;
      profileLink.setAttribute('aria-label', interpolate(t(service === 'Spotify' ? 'profileSpotify' : 'profileSoundcloud'), { artist: currentSong.artist }));
    });
    updateFavoriteButton();
  }

  function updateFavoriteButton() {
    const isSaved = currentSong && savedSongs.some((song) => song.id === currentSong.id);
    const button = $('#favorite-button');
    button.classList.toggle('saved', Boolean(isSaved));
    button.querySelector('.favorite-label').textContent = t(isSaved ? 'savedAction' : 'saveAction');
    button.setAttribute('aria-label', t(isSaved ? 'removeSaved' : 'saveSong'));
    button.title = t(isSaved ? 'removeSaved' : 'saveSong');
  }

  function saveCurrentSong() {
    if (!currentSong) return;
    const index = savedSongs.findIndex((song) => song.id === currentSong.id);
    if (index >= 0) {
      savedSongs.splice(index, 1);
      toast(t('removedToast'));
    } else {
      savedSongs.unshift(currentSong);
      toast(t('savedToast'));
    }
    try { localStorage.setItem(savedKey, JSON.stringify(savedSongs)); } catch (_) { toast(t('saveError')); }
    $('#saved-count').textContent = localizedNumber(savedSongs.length);
    updateSectionText();
    updateFavoriteButton();
  }

  function showSavedSongs() {
    activeSearch += 1;
    setBusy(false);
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === 'saved'));
    viewMode = 'saved';
    emptyMode = 'saved-empty';
    setSearchResultsOpen(false);
    moveResultsToSavedSlot();
    updateSectionText();
    detailNode.hidden = true;
    emptyNode.hidden = savedSongs.length > 0;
    resultsNode.hidden = savedSongs.length === 0;
    if (savedSongs.length) renderResults(savedSongs);
    else {
      updateEmptyText();
      resultsNode.replaceChildren();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showHome() {
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === 'home'));
    moveResultsToSearchMenu();
    if (currentResults.length) {
      viewMode = currentSong ? 'detail' : 'results';
      updateSectionText();
      renderResults(currentResults);
      resultsNode.hidden = Boolean(currentSong);
      setSearchResultsOpen(!currentSong && currentResults.length > 0);
      detailNode.hidden = !currentSong;
      emptyNode.hidden = true;
    } else {
      viewMode = 'home';
      emptyMode = 'home';
      updateSectionText();
      updateEmptyText();
      setSearchResultsOpen(false);
      resultsNode.hidden = true;
      detailNode.hidden = true;
      emptyNode.hidden = false;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clampSnippetLines(value) {
    const lines = value.split(/\r\n?|\n/);
    let lineCount = 0;
    let endIndex = lines.length;
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].trim() && ++lineCount > 5) {
        endIndex = index;
        break;
      }
    }
    return { value: lines.slice(0, endIndex).join('\n').trim(), truncated: endIndex < lines.length };
  }

  function updateSnippetCount() {
    const limited = clampSnippetLines(snippetInput.value);
    if (limited.truncated) {
      snippetInput.value = limited.value;
      toast(t('tooManyLines'), 'error');
    }
    const count = snippetInput.value.length;
    const counter = $('#character-count');
    counter.textContent = interpolate(t('charCount'), { count: localizedNumber(count) });
    counter.style.color = count > 280 ? '#fa926d' : '';
    const preview = $('#share-canvas');
    if (currentSong && count) drawCard(cardFormat);
    else preview.hidden = true;
  }


  function wrapText(context, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function shareCardKey(format) {
    return JSON.stringify([
      currentSong && currentSong.id,
      format,
      snippetInput.value.trim(),
      currentLanguage,
      currentArtworkForCard && currentArtworkForCard.src,
      currentCoverRGB,
    ]);
  }

  function scheduleShareBlob(canvas, format) {
    const key = shareCardKey(format);
    clearTimeout(shareBlobTimer);
    shareBlobCache.clear();
    shareBlobTimer = setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob || shareCardKey(format) !== key) return;
        shareBlobCache.set(key, blob);
      }, 'image/png');
    }, 120);
  }

  function primeShareBlobs() {
    if (!currentSong || !snippetInput.value.trim()) return;
    clearTimeout(shareBlobTimer);
    const songId = currentSong.id;
    const snippet = snippetInput.value.trim();
    const originalFormat = cardFormat;
    const pending = ['post', 'story'].map((format) => {
      const canvas = drawCard(format, false);
      const key = shareCardKey(format);
      return new Promise((resolve) => canvas.toBlob((blob) => resolve({ format, key, blob }), 'image/png'));
    });
    drawCard(originalFormat, false);
    Promise.all(pending).then((results) => {
      if (!currentSong || currentSong.id !== songId || snippetInput.value.trim() !== snippet) return;
      shareBlobCache.clear();
      results.forEach(({ format, key, blob }) => {
        if (blob && shareCardKey(format) === key) shareBlobCache.set(key, blob);
      });
    });
  }

  function drawCard(format = cardFormat, cacheShare = true) {
    cardFormat = format;
    const canvas = $('#share-canvas');
    const story = format === 'story';
    canvas.width = 1080;
    canvas.height = story ? 1920 : 1350;
    canvas.classList.toggle('story-preview', story);
    canvas.hidden = false;
    const ctx = canvas.getContext('2d');
    const height = canvas.height;
    const persian = currentLanguage === 'fa';
    const edge = persian ? canvas.width - 88 : 88;
    const align = persian ? 'right' : 'left';
    const sansFont = persian ? 'Vazirmatn, Tahoma, sans-serif' : 'Inter, "Segoe UI", Arial, sans-serif';
    const lyricFont = sansFont;
    ctx.direction = persian ? 'rtl' : 'ltr';
    ctx.textAlign = align;
    const theme = {
      top: '#1d2a20', bottom: '#111411', accent: '#1ed760', secondary: '#1ed760',
      text: '#f7f7f7', muted: '#b3b3b3',
    };
    const tintCardColor = (hex, amount) => {
      if (!currentCoverRGB) return hex;
      const channels = hex.match(/[a-f\d]{2}/gi)?.map((channel) => parseInt(channel, 16));
      if (!channels || channels.length < 3) return hex;
      const mixed = channels.map((channel, index) => Math.round(channel * (1 - amount) + currentCoverRGB[index] * amount));
      return `rgb(${mixed.join(', ')})`;
    };
    const gradient = ctx.createLinearGradient(0, 0, 900, height);
    gradient.addColorStop(0, tintCardColor(theme.top, .28));
    gradient.addColorStop(1, tintCardColor(theme.bottom, .18));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, height);

    const glowX = persian ? 180 : 900;
    const glow = ctx.createRadialGradient(glowX, height * .12, 10, glowX, height * .12, 340);
    glow.addColorStop(0, `${theme.secondary}58`);
    glow.addColorStop(1, `${theme.secondary}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(persian ? 0 : 500, 0, 580, height * .42);

    const hasCover = currentArtworkForCard && currentArtworkSongId === currentSong.id && currentArtworkForCard.naturalWidth;
    const coverSize = 148;
    const coverX = persian ? 88 : canvas.width - 88 - coverSize;
    const coverY = height * .15;
    if (hasCover) {
      const radius = 18;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(coverX + radius, coverY);
      ctx.arcTo(coverX + coverSize, coverY, coverX + coverSize, coverY + coverSize, radius);
      ctx.arcTo(coverX + coverSize, coverY + coverSize, coverX, coverY + coverSize, radius);
      ctx.arcTo(coverX, coverY + coverSize, coverX, coverY, radius);
      ctx.arcTo(coverX, coverY, coverX + coverSize, coverY, radius);
      ctx.closePath(); ctx.clip();
      ctx.drawImage(currentArtworkForCard, coverX, coverY, coverSize, coverSize);
      ctx.restore();
    }
    const metaAlign = hasCover ? 'right' : align;
    const metaX = hasCover ? (persian ? canvas.width - 88 : coverX - 22) : edge;
    ctx.textAlign = metaAlign;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(metaAlign === 'right' ? metaX - 50 : metaX, coverY + 3, 50, 3);
    ctx.fillStyle = theme.text;
    ctx.font = `600 27px ${sansFont}`;
    ctx.fillText(currentSong.title, metaX, coverY + 48, hasCover ? 620 : 860);
    ctx.fillStyle = theme.muted;
    ctx.font = `500 21px ${sansFont}`;
    ctx.fillText(currentSong.artist, metaX, coverY + 88, hasCover ? 620 : 860);
    if (currentSong.album) {
      ctx.font = `400 17px ${sansFont}`;
      ctx.fillText(`${t('albumLabel')}: ${currentSong.album}`, metaX, coverY + 126, hasCover ? 620 : 860);
    }
    ctx.textAlign = align;

    const quote = snippetInput.value.trim();
    let fontSize = quote.length > 260 ? 46 : quote.length > 150 ? 56 : 68;
    const maxWidth = 900;
    const quoteTop = height * .385;
    const maxQuoteHeight = height * (story ? .34 : .37);
    let lines;
    do {
      ctx.font = `500 ${fontSize}px ${lyricFont}`;
      lines = wrapText(ctx, quote, maxWidth);
      if (lines.length * fontSize * 1.24 <= maxQuoteHeight || fontSize <= 38) break;
      fontSize -= 4;
    } while (fontSize > 34);
    ctx.fillStyle = theme.text;
    ctx.font = `500 ${fontSize}px ${lyricFont}`;
    const lineHeight = fontSize * 1.24;
    let y = quoteTop + Math.max(fontSize, (maxQuoteHeight - lines.length * lineHeight) / 2 + fontSize);
    for (const line of lines) {
      ctx.fillText(line, edge, y, maxWidth);
      y += lineHeight;
    }
    ctx.fillStyle = theme.accent;
    ctx.fillRect(persian ? edge - 54 : edge, height - 224, 54, 3);
    if (cacheShare) scheduleShareBlob(canvas, format);
    return canvas;
  }

  function downloadBlob(blob, filename, message) {
    if (!blob) return toast(t('imageError'));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast(message);
  }

  async function prepareCard(format) {
    const song = currentSong;
    if (!song) return null;
    const image = await loadArtworkImage(song);
    if (!currentSong || currentSong.id !== song.id) return null;
    currentArtworkForCard = image;
    currentArtworkSongId = song.id;
    applyCoverTheme(image);
    if (currentLanguage === 'fa' && document.fonts && document.fonts.ready) await document.fonts.ready;
    return drawCard(format);
  }

  async function downloadCard() {
    if (!validateSnippet()) return;
    const canvas = await prepareCard('post');
    if (!canvas) return toast(t('imageError'));
    canvas.toBlob((blob) => downloadBlob(blob, `lyricsify-${slug(currentSong.title)}-post.png`, t('cardReady')), 'image/png');
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lyric-card';
  }

  function validateSnippet() {
    if (!currentSong) return false;
    const limited = clampSnippetLines(snippetInput.value);
    if (limited.truncated) {
      snippetInput.value = limited.value;
      updateSnippetCount();
      toast(t('tooManyLines'), 'error');
      return false;
    }
    if (!snippetInput.value.trim()) {
      toast(t('emptySnippet'));
      snippetInput.focus();
      return false;
    }
    return true;
  }

  function canShareImageFile(file) {
    if (!file || typeof navigator.share !== 'function') return false;
    if (typeof navigator.canShare !== 'function') return true;
    try { return navigator.canShare({ files: [file] }); } catch (_) { return false; }
  }

  function instagramDownloadMessage(format) {
    return t(format === 'story' ? 'instagramStoryDownloaded' : 'instagramPostDownloaded');
  }

  function buildShareText(maxLength = 280) {
    const prefix = t('xSharePrefix');
    const appCredit = t('shareAppCredit');
    let songCredit = interpolate(t('shareCredit'), { title: currentSong.title, artist: currentSong.artist });
    const creditLimit = Math.max(12, maxLength - prefix.length - appCredit.length - 3);
    if (songCredit.length > creditLimit) songCredit = `${songCredit.slice(0, creditLimit - 1).trimEnd()}…`;
    const snippet = snippetInput.value.trim();
    const room = Math.max(0, maxLength - prefix.length - appCredit.length - songCredit.length - 2);
    const excerpt = snippet.length > room ? `${snippet.slice(0, Math.max(0, room - 1)).trimEnd()}…` : snippet;
    return `${prefix}${excerpt}\n${appCredit}\n${songCredit}`;
  }

  function openXComposer(text) {
    toast(t('xComposerReady'));
    return window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function shareImage(format = 'post', destination = 'Share') {
    if (!validateSnippet()) return;
    const song = currentSong;
    let canvas = $('#share-canvas');
    if (canvas.hidden || cardFormat !== format) canvas = drawCard(format, false);
    const key = shareCardKey(format);
    const filename = `lyricsify-${slug(song.title)}-${format}.png`;
    const caption = buildShareText();

    // X's web composer cannot accept an image file. If the cached card isn't ready,
    // open its text composer immediately while the tap still has user activation.
    if (destination === 'X' && !shareBlobCache.has(key)) {
      openXComposer(caption);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, filename, t('xImageFallback'));
        else toast(t('imageError'));
      }, 'image/png');
      return;
    }

    const blob = shareBlobCache.get(key) || await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return toast(t('imageError'));
    if (!currentSong || currentSong.id !== song.id) return;
    const file = typeof File === 'function' ? new File([blob], filename, { type: 'image/png' }) : null;
    if (!canShareImageFile(file)) {
      if (destination === 'X') {
        openXComposer(caption);
        downloadBlob(blob, filename, t('xImageFallback'));
      } else {
        const message = destination.startsWith('Instagram') ? instagramDownloadMessage(format) : t('cardReady');
        downloadBlob(blob, filename, message);
      }
      return;
    }
    try {
      await navigator.share({
        title: interpolate(t('shareTitle'), { title: song.title, artist: song.artist }),
        text: caption,
        files: [file],
      });
      if (destination === 'X') toast(t('xShareReady'));
      else if (destination.startsWith('Instagram')) toast(t('instagramShareReady'));
      else toast(t('cardReady'));
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (destination === 'X') {
        openXComposer(caption);
        downloadBlob(blob, filename, t('xImageFallback'));
      } else if (destination.startsWith('Instagram')) {
        downloadBlob(blob, filename, instagramDownloadMessage(format));
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, filename, t('sharingFailed'));
      }
    }
  }

  function shareCard() {
    return shareImage('post', 'Share');
  }

  function toggleInstagramMenu(force) {
    const button = $('#instagram-toggle');
    const menu = $('#instagram-options');
    const open = typeof force === 'boolean' ? force : button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (open) primeShareBlobs();
  }

  async function shareInstagram(format) {
    toggleInstagramMenu(false);
    if (!validateSnippet()) return;
    const canTryNativeShare = typeof File === 'function'
      && canShareImageFile(new File([''], 'lyricsify-share-check.png', { type: 'image/png' }));
    // Open Instagram while the tap still has user activation if native image sharing is unavailable.
    if (!canTryNativeShare) window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    await shareImage(format, format === 'story' ? 'Instagram Story' : 'Instagram Post');
  }

  async function copySnippet() {
    if (!validateSnippet()) return;
    const text = interpolate(t('copyFormat'), { snippet: snippetInput.value.trim(), title: currentSong.title, artist: currentSong.artist });
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.style.position = 'fixed'; helper.style.opacity = '0';
      document.body.append(helper); helper.select();
      const copied = document.execCommand('copy'); helper.remove();
      if (!copied) return toast(t('copyFailed'));
    }
    toast(t('copied'));
  }

  function postToX() {
    return shareImage('post', 'X');
  }

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(searchDebounceTimer);
    const query = searchInput.value.trim();
    if (!query) { searchInput.focus(); return; }
    currentResults = [];
    currentSong = null;
    moveResultsToSearchMenu();
    setSearchResultsOpen(true);
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === 'home'));
    const viewLabel = $('#view-label');
    if (viewLabel) viewLabel.textContent = t('viewDiscover');
    performSearch(query, providerSelect.value);
  });
  document.querySelectorAll('.suggestion').forEach((button) => button.addEventListener('click', () => {
    searchInput.value = button.dataset.query;
    searchForm.requestSubmit();
  }));
  document.querySelectorAll('.nav-link').forEach((button) => button.addEventListener('click', () => button.dataset.view === 'saved' ? showSavedSongs() : showHome()));
  $('#favorite-button').addEventListener('click', saveCurrentSong);
  $('#language-toggle').addEventListener('click', () => {
    const language = currentLanguage === 'fa' ? 'en' : 'fa';
    applyLanguage(language);
    try { localStorage.setItem('lyricsify.language.v1', language); } catch (_) { /* this tab still changes language */ }
  });
  $('#theme-toggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('lyricsify.theme.v1', theme); } catch (_) { /* the current tab still switches themes */ }
  });
  snippetInput.addEventListener('input', () => {
    clearLyricLineSelection();
    updateSnippetCount();
  });
  $('#share-button').addEventListener('click', shareCard);
  $('#instagram-toggle').addEventListener('click', () => toggleInstagramMenu());
  $('#instagram-story').addEventListener('click', () => shareInstagram('story'));
  $('#instagram-post').addEventListener('click', () => shareInstagram('post'));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.instagram-share')) toggleInstagramMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleInstagramMenu(false);
      setSearchResultsOpen(false);
    }
  });
  $('#x-button').addEventListener('click', postToX);
  $('#download-button').addEventListener('click', downloadCard);
  $('#copy-button').addEventListener('click', copySnippet);
  lyricsNode.addEventListener('click', (event) => {
    const line = event.target.closest('.lyric-line');
    if (line && lyricsNode.contains(line)) toggleLyricLine(line);
  });
  $('#about-button').addEventListener('click', () => $('#about-dialog').showModal());
  $('#saved-view-button').addEventListener('click', showSavedSongs);
  $('#home-link').addEventListener('click', (event) => {
    event.preventDefault();
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.focus();
  });
  $('#dialog-close').addEventListener('click', () => $('#about-dialog').close());
  $('#dialog-ok').addEventListener('click', () => $('#about-dialog').close());
  $('#about-dialog').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    activeSearch += 1;
    setBusy(false);
    setSearchResultsOpen(false);
    resultsNode.replaceChildren();
    resultsNode.hidden = true;
    resultsSlot.replaceChildren();
    currentResults = [];
    currentSong = null;
    detailNode.hidden = true;
    emptyNode.hidden = true;
    setNotice('');
    resetCoverTheme();
    viewMode = 'home';
    emptyMode = 'home';
    updateSectionText();
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      searchDebounceTimer = setTimeout(() => {
        if (query === searchInput.value.trim()) searchForm.requestSubmit();
      }, 700);
    }
  });
  searchInput.addEventListener('focus', () => {
    if (viewMode === 'results' && currentResults.length > 0) setSearchResultsOpen(true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#search-form')) setSearchResultsOpen(false);
  });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.value.trim()) {
      clearTimeout(searchDebounceTimer);
      event.preventDefault();
      searchForm.requestSubmit();
    }
  });
  $('#saved-count').textContent = localizedNumber(savedSongs.length);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
})();
