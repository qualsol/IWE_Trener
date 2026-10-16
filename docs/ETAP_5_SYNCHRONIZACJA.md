# Etap 5 — synchronizacja postępów między urządzeniami (projekt)

## Założenia
- GitHub Pages nadal serwuje aplikację, a nauka offline i localStorage pozostają dostępne bez logowania.
- Synchronizacja jest opcjonalna i wymaga uwierzytelnienia; rekomendowany backend: Supabase Auth + PostgreSQL z RLS.
- Nigdy nie umieszczaj klucza service_role ani innych sekretów backendu w plikach aplikacji.
- Dane każdego użytkownika są dostępne wyłącznie dla niego (polityki RLS i testy izolacji).
- Eksport i import JSON pozostają dostępne niezależnie od synchronizacji.

## Ryzyko: konflikt dwóch urządzeń
Obecny model postępów przechowuje liczniki, historię odpowiedzi, statusy powtórek i historię egzaminów w localStorage. Nie wolno bezrefleksyjnie scalać liczników ani stosować "ostatni zapis wygrywa" — może to usunąć wyniki z drugiego urządzenia lub zdublować próby.

## Plan implementacji
1. Przygotować projekt Supabase, URL i **publiczny** klucz anon/publishable; skonfigurować logowanie i przekierowania dla domeny GitHub Pages.
2. Wprowadzić identyfikatory zdarzeń odpowiedzi i egzaminów (UUID) oraz stabilny identyfikator urządzenia. Wykonać migrację lokalnej historii, nie przypisując nieistniejących dat starszym danym.
3. Wprowadzić tabelę zdarzeń z unikatowym (user_id, event_id), reguły RLS i upsert idempotentny. Dane bieżące odtwarzać z deduplikowanych zdarzeń; starsze agregaty migrować ostrożnie jako snapshot bazowy, bez sumowania duplikatów.
4. Pierwsze połączenie: wykryć dane lokalne i chmurowe, pokazać podsumowanie i wymagane potwierdzenie użytkownika przed importem/scaleniem.
5. Kolejka offline i ponowne próby synchronizacji, status synchronizacji, obsługa wylogowania i błędów.
6. Testy: równoległa nauka na dwóch urządzeniach, ponowna synchronizacja, duplikaty, konflikty, brak sieci, przywrócenie kopii, izolacja kont.

## Kryteria odbioru
- Brak utraty istniejących lokalnych postępów po pierwszym logowaniu.
- Brak podwójnego naliczania tych samych prób przy ponownym przesyłaniu.
- Użytkownik A nie może odczytać ani zmienić danych użytkownika B.
- Aplikacja działa offline i bez konta.
- Wymiana danych między urządzeniami nie wymaga ręcznego eksportu JSON.
