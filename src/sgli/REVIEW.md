# Little India review notes

## Target selection
The most recognisable buildings within about 500 m of Serangoon Road / Little India MRT:
- **Temples and mosques:** Sri Veeramakaliamman, Sri Srinivasa Perumal (rajagopuram),
  Masjid Abdul Gafoor, Masjid Angullia.
- **Heritage:** House of Tan Teng Niah, Indian Heritage Centre, Little India Arcade.
- **Commerce:** Tekka Centre, Mustafa Centre, City Square Mall.
- **Night:** the Deepavali light-up arches and garlands along Serangoon Road.

The generic OSM pass continues to cover HDB blocks and ordinary shophouse rows.
Little India MRT is underground (only entrances show), so it is not a landmark module.

## Silhouette IoU method
This is the same method as `src/sgje/REVIEW.md`: a tileset clipped to the footprint and
buffered by 3 m, a column-filled reference mask, and a model mask of the landmark group
only. Low-rise shophouse targets under street trees give noisy IoU, so treat it as a
coarse fit signal. For Srinivasa Perumal the reference clip uses the whole temple
compound, so the module must model the compound halls as well as the gopuram.
The street light-up has no IoU and is checked against night photographs instead.
