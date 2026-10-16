# IWE Trener Online — publikacja GitHub Pages

## Jak opublikować

1. Zaloguj się na https://github.com i utwórz **publiczne** repozytorium, np. `iwe-trener`.
2. Kliknij **Add file → Upload files** i prześlij pliki z **wnętrza** tego folderu (w szczególności `index.html`, `sw.js`, `manifest.json`, ikony i `.nojekyll`). Nie przesyłaj samego archiwum ZIP jako strony.
3. Zatwierdź **Commit changes**.
4. W repozytorium wybierz **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, folder `/ (root)`, **Save**.
5. Poczekaj na publikację. Adres będzie podobny do `https://TWOJ-LOGIN.github.io/iwe-trener/`.
6. Otwórz adres w Chrome/Edge. Po pierwszym pełnym wczytaniu aplikacja może działać również bez internetu dzięki service workerowi.
7. Na Androidzie w menu Chrome wybierz **Dodaj do ekranu głównego** lub **Zainstaluj aplikację** (jeżeli dostępne).

## Ważne

- Strona zawiera wbudowaną bazę pytań i jest publiczna. Publikuj ją tylko jeśli masz prawo do udostępnienia treści pytań.
- Arkusz `TESTY DO IWE.xlsx` nie jest celowo dołączony do publicznej paczki. Możesz go zaimportować przez przycisk **Importuj Excel**; plik pozostaje na Twoim urządzeniu.
- Wyniki, importowana baza i statystyki pozostają w pamięci przeglądarki danego urządzenia. Nie ma automatycznej synchronizacji między urządzeniami. Używaj kopii zapasowej JSON.
- Dla kolejnej aktualizacji podmień pliki w repozytorium. Aby wymusić aktualizację offline, zwiększ wersję `CACHE` w `sw.js`.
- Nie jest potrzebny backend ani płatny hosting. W trybie lokalnym `index.html` nadal działa, ale funkcje instalacji/offline PWA wymagają HTTPS (np. GitHub Pages).
- Przed pierwszym użyciem offline otwórz opublikowaną stronę online, poczekaj na załadowanie i przetestuj ją w trybie samolotowym.
