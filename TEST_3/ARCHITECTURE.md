# TEST_3 — architektura danych (projekt)

## Założenia
- Start bez migracji historii z wersji 1.4.0.
- Oddzielna przestrzeń danych przeglądarki dla TEST_3.
- Jedno źródło prawdy: niezmienne zdarzenia odpowiedzi, z których obliczane są statystyki.
- Pytania i odpowiedzi posiadają stabilne identyfikatory niezależne od pozycji i litery w Excelu.
- Każdy import otrzymuje UUID, a każda zmiana klucza tworzy nową wersję klucza.
- Historia próby przechowuje identyfikator wersji klucza i migawkę użytej punktacji.
- Powtórny import tego samego pliku nie tworzy nowych pytań ani zdarzeń.
- Konflikty dopasowania identycznych pytań muszą zostać zgłoszone, a nie rozstrzygane przez pozycję w arkuszu.
- Import kopii JSON jest walidowany i atomowy; zawiera wersję schematu.

## Encje
Question(id, module, text, revisionId, active)
Answer(id, questionId, text, order)
AnswerKey(id, questionId, correctAnswerIds, createdAt, importId)
ImportBatch(id, checksum, createdAt, changes)
Session(id, type, startedAt, finishedAt, config)
Attempt(id, sessionId, questionId, revisionId, keyId, selectedAnswerIds, score, maxScore, correct, createdAt)
Backup(schemaVersion, backupId, exportedAt, questionBank, sessions, attempts, imports, preferences)

## Inwarianty
- Każdy Attempt wskazuje istniejącą Session, Question i AnswerKey.
- Wybrane answerId należą do tego samego questionId.
- Dla jednej sesji i pytania możliwe jest wiele prób tylko wtedy, gdy tryb ćwiczenia jawnie to dopuszcza.
- Wyniki historyczne nie zmieniają się po imporcie nowego klucza; bieżący poziom opanowania może być przeliczany według aktualnej wersji.
- Statystyki są funkcjami zbioru prób, bez osobno zapisywanych liczników jako źródła prawdy.

## Migracja
Brak migracji historii 1.4.0. Nowy schemat TEST_3 startuje z pustym zbiorem sesji i prób. Baza pytań pozostaje dostępna.

## Kolejne kroki
1. Inwentaryzacja funkcji 1.4.0 i testy regresyjne.
2. Implementacja magazynu danych i niezmiennych zdarzeń.
3. Wersjonowany import Excel i mechanizm dopasowania pytań.
4. Przepięcie nauki, egzaminów i analityki do wspólnego modelu.
5. Eksport/import JSON i testy odtworzenia.
6. Testy przeglądarkowe i publikacja stabilnego TEST_3.
