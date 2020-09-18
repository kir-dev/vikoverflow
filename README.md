# vikoverflow

## Használat

### Lokális fejlesztés

- ingyenes AWS account setupolása a [GitHub Student Developer Pack](https://education.github.com/pack)-on keresztül
- `npm i`
- a `.env.example` fájl duplikálni `.env` néven és az új `.env` fájl üresen hagyott változóit kitölteni
- `npm run setup-aws` - csak a legelső alkalommal kell, hogy az AWS accountodon létrejöjjenek a szükséges erőforrások
- `npm run dev`

### Lokális tesztelés

- `npm run build` - ezt nem kell minden alkalommal lefuttadnod, csak akkor ha változtattál valamit a `tests` mappán kívül is
- `npm run test`
