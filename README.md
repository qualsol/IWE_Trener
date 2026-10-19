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

## Zmiana układu
Sekcja kopii zapasowej JSON znajduje się na przedostatniej pozycji strony głównej, a import Excel na samym dole. Nie zmieniono funkcji aplikacji. Zwiększono wersję cache PWA do v2.

Aktualizacja układu: „Zakres nauki” znajduje się bezpośrednio przed „Plan nauki i opanowanie materiału”.

## Aktualizacja nagłówka
Nagłówek pokazuje liczbę pytań opanowanych na podstawie istniejących zasad inteligentnych powtórek.


## Korekta klucza odpowiedzi
Ponowny import XLSX zachowuje identyfikator pytania przy zmianie klucza (treść, moduł i opcje bez zmian). Resetuje wyłącznie bieżący postęp nauki zmienionego pytania, zachowując historię egzaminów. Duplikaty dopasowywane są według kolejności w arkuszu. Przed aktualizacją zalecany eksport kopii JSON.


## Plan wdrożeń
- Etap 1: inteligentne zestawy i szybkie powtarzanie błędów.
- Etap 2: realistyczny egzamin 80 pytań i raport.
- Etap 3: bezpieczne aktualizacje i historia wersji.
- Etap 4: synchronizacja między urządzeniami (wymaga zewnętrznej usługi).

## Wersja główna — IWE Trener 2.0

Główna aplikacja jest dostępna pod `https://qualsol.github.io/IWE_Trener/` i korzysta z wbudowanego arkusza `TESTY DO IWE(3).xlsx`. Historia nauki 2.0 jest przechowywana oddzielnie od poprzedniej wersji (bez synchronizacji między urządzeniami). Wersja rozwojowa pozostaje w folderze `TEST_3`.

**Uwaga:** arkusz XLSX jest publicznie dostępny w repozytorium i w witrynie GitHub Pages. Udostępniaj go wyłącznie, jeżeli masz prawo publikować jego zawartość.
