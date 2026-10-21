# Historia wersji — IWE Trener

## 2.1.2 — 2026-10-21

- T21-02: historia nowych odpowiedzi przechowuje `localDay` (lokalny dzień nauki), który jest używany podczas odtwarzania serii i dni powtórek przy scalaniu JSON.
- Zachowano zgodność ze starszymi wpisami v3 bez `localDay`; dla nich pozostaje awaryjne wyznaczanie dnia z daty UTC. Nie da się odzyskać oryginalnej strefy czasowej historycznych wpisów.
- Rozszerzono testy regresyjne o przypadek odpowiedzi przy północy UTC, walidację kopii JSON v3 oraz ponowne scalanie tej samej kopii z egzaminami.
- Zwiększono wersję aplikacji do 2.1.2 oraz cache PWA do `iwe-trener-main-v28`.
- Testy rzeczywistej synchronizacji między dwoma urządzeniami oraz pełny test przeglądarkowy pozostają do wykonania.

## 2.1.1 — 2026-10-21

- Poprawiono scalanie historii egzaminów: rekordy `examHistory` są identyfikowane przez `eventId` i `examId`, bez nieprawidłowego wymagania `sessionId`; nadal wykrywane są konflikty identyfikatorów.
- Poprawiono licznik poznanych pytań w zestawieniu modułów: samo oznaczenie gwiazdką nie jest traktowane jako udzielenie odpowiedzi.
- Dodano testy regresyjne `tests/regression-2.1.1.cjs` oraz workflow GitHub Actions do ich uruchamiania po zmianach w `main`.
- Zwiększono wersję aplikacji do 2.1.1 i identyfikator cache PWA do `iwe-trener-main-v27`.
- Nadal do sprawdzenia: różnice między datami lokalnymi i UTC w harmonogramie opanowania, testy przeglądarkowe i synchronizacja między urządzeniami.

## 2.1 — 2026-10-21

- Nowy system zapisu postępów: unikalne identyfikatory odpowiedzi (`eventId`), sesji (`sessionId`) oraz egzaminów (`examId`).
- Rejestr ukończonych sesji (`sessionHistory`) i liczniki oparte na unikalnych zapisach.
- Scalanie kopii JSON według identyfikatorów, bez ponownego naliczania tych samych zdarzeń; wykrywanie konfliktów treści dla identycznych identyfikatorów.
- Nowy format kopii zapasowej (wersja 3), wymagający identyfikatorów. Historia starszych wyników nie jest automatycznie przenoszona do nowego magazynu.
- Rozszerzony zapis odpowiedzi egzaminacyjnych o zaznaczone opcje i migawkę klucza; kontrola zgodności punktacji oraz zabezpieczenie kopii przed przywracaniem.
- Poprawka zapisu odpowiedzi przy kończeniu egzaminu.
- Przywrócenie pierwotnej granatowo-niebieskiej kolorystyki.
- Responsywny układ wyboru modułów, dostosowujący się do wąskich okien aplikacji Chrome.

## 2.0 — wcześniejsza wersja

- Nauka i egzaminy próbne IWE, historia odpowiedzi, statystyki, powtórki, obsługa kopii JSON oraz praca jako aplikacja PWA.

> Uwaga: wpisy opisują zmiany w kodzie. Nie stanowią potwierdzenia pełnych testów integracyjnych.
