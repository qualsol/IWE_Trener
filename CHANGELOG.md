# Historia wersji — IWE Trener

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
