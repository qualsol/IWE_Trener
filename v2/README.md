# IWE Trener 2.0 — projekt przebudowy

Status: etap 1 — nowy model danych. Gałąź `iwe-trener-v2`; nie wdrażać do `main` przed testami.

## Zasady
- Nowy profil nauki zaczyna z zerową liczbą odpowiedzi. Dane wersji 1 nie są automatycznie importowane do aktywnej historii.
- Archiwum wersji 1: zachować osobne pliki JSON eksportowane z każdego urządzenia; nie nadpisywać ani nie usuwać dotychczasowego `localStorage` i tabel `learning_events`.
- `questionId` jest trwałym identyfikatorem logicznego pytania, niezależnym od wiersza Excela. `revisionId` identyfikuje konkretną wersję treści i klucza odpowiedzi.
- `optionId` jest trwałym identyfikatorem wariantu odpowiedzi w danej wersji; poprawnych może być wiele.
- `eventId` jest nowym UUID generowanym w momencie udzielenia odpowiedzi; `sessionId` identyfikuje test.
- Zdarzenia są niemutowalne; wyniki i statystyki są wyliczane z historii, nie przechowywane jako niezależna prawda.
- IndexedDB przechowuje zdarzenia offline. Synchronizacja przesyła brakujące zdarzenia do osobnych tabel v2 w Supabase; brak kasowania ani nadpisywania v1.
- Duplikaty wykrywane po `eventId`, a pobieranie stronicowane; synchronizacja idempotentna i odporna na przerwanie.
- Zmiana bazy pytań nie może po cichu zmienić interpretacji zapisanej odpowiedzi.
- Przy błędzie zapisu nie potwierdzaj użytkownikowi zapisania odpowiedzi.

## Etapy
1. Model danych i walidacja zdarzeń (rozpoczęte).
2. Repozytorium IndexedDB i migracje schematu.
3. Silnik nauki/egzaminów oparty na zdarzeniach.
4. Oddzielna synchronizacja v2 z Supabase, RLS i testami na dwóch urządzeniach.
5. Archiwum v1 tylko do odczytu, eksport i import weryfikowany.
6. Testy integracyjne i dopiero potem publikacja.

## Kryteria odbioru
- Ta sama historia zdarzeń daje identyczne statystyki na obu urządzeniach.
- Ponowne wysłanie zdarzenia nie zmienia liczników.
- Praca offline i późniejsza synchronizacja nie gubi odpowiedzi.
- Przekroczenie limitu localStorage nie wpływa na historię v2.
- Test wielokrotnego wyboru zachowuje wszystkie zaznaczone `optionId`.
