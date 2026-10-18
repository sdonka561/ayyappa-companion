# Ayyappa companion design

## Direction

User-directed Ayyappa black-and-white theme: black navigation, white reading pages, neutral gray states and rules, and the real photograph from the supplied collection preserved in natural color, as requested. Preserve the existing layout and reading behavior. The surface is a reading guide, not a promotional landing page or a grid of PDF cards.

## Tokens

`--black: #111111`; `--heading: #000000`; `--white: #ffffff`; `--ink: #202020`; `--muted: #595959`; `--line: #dedede`; `--canvas: #ffffff`. All interface colors, including focus, status, hover, checked, dialog, and mobile states, are achromatic. Status is also expressed through visible text, not color alone.

System typography: Segoe UI, Nirmala UI, system sans. The body reading size is adjustable from 16 to 24px; default 18px. Telugu has additional line height and more restrained heading scale.

## Composition and behavior

Desktop: sticky black topic rail, search/language/share toolbar, reading column with a narrow anchored contents spine. Tablet collapses the contents spine above the article. Below 760px, the topic rail becomes a horizontally scrollable navigation strip, with the selected topic kept in view.

Only the introductory daily topic uses the arch-cropped devotional photograph. Content sections are separated by whitespace and rules, not nested cards. Editorial/confirmation labels are visibly distinct from source citations. Source-library groups use native disclosure elements.

Language, topic, section, and search are reflected in the URL. Topic changes move keyboard focus to the reading area. The skip link preserves the current route. Controls have visible keyboard focus, minimum touch sizes, reduced-motion handling, and print styles. Materials-preparation checkmarks last for the current visit and do not claim religious completion.

Chant & Sing adds large Telugu/Roman text, numbered reading positions, full-list and single-entry modes, and a focus view without navigation distractions. Controls advance text and must never suggest audio playback where no recording exists. Morning/evening quick access uses local time with a manual override. The daily puja checklist saves per local date on the device, separately from the visit-only materials checklists.

## Content integrity

Do not hide source disagreements or imply every source file was consolidated. Preserve page/sheet references, the permanent Drive collection, and separate editorial health/safety guidance from source-derived observances.
