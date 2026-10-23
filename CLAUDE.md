# gozdesirganci.com — working guide

Personal professional website of **Gözde Sırgancı** (EN: "Gözde Sırgancı, PhD"; TR: "Doç. Dr. Gözde Sırgancı"), psychometrician working on fair, valid assessment, IRT, DIF, scale development and AI in assessment. The owner is Turkish; talk to her in Turkish unless she writes in English.

This repository is the single source of truth for the live site. (An older draft also exists as a claude.ai artifact; it is out of date — do not edit it.)

## How publishing works

- Static HTML only, no build step. Everything served lives in `public/`.
- Cloudflare Workers (project `gozdesirganci`, static assets) is connected to this repo. **Every push to `main` deploys automatically** in 1–2 minutes. Config: `wrangler.jsonc` (assets dir `./public`, `html_handling: auto-trailing-slash`).
- Custom domains: `gozdesirganci.com` and `www.gozdesirganci.com`.
- Google Search Console is verified for the domain (DNS TXT record in Cloudflare — never remove it). Sitemap: `public/sitemap.xml`.
- Do not push half-finished work to `main`: it goes live immediately. Finish, check, then push.

## Structure

```
public/
  index.html              home (hero with portrait, expertise, selected work, tools teaser, funded projects, experience, contact)
  fairness/index.html     Fairness & DIF topic page (interactive 2PL DIF demo, publications, references)
  scales/index.html       Scale development topic page (Spearman–Brown α demo, sequence, publications, references)
  tools/index.html        Interactive tools: rating scale categories (Andrich RSM), CAT simulator (2PL, max-info, EAP),
                          Mantel–Haenszel DIF calculator (ETS A/B/C), alpha vs omega
  tools/mh-data.js        Whole-test MH DIF from an uploaded CSV (shared by EN and TR; strings switch on <html lang>)
  tr/...                  Turkish mirror of every page above (same file layout under /tr/)
  img/gozde-sirganci.jpg  portrait (hero) · img/og.jpg social preview image
  sitemap.xml, robots.txt
```

## Rules

1. **Bilingual always.** Any content change goes into both the English page and its `/tr/` twin in the same commit. Every page has an EN|TR switcher (`<nav class="lang">`) and `hreflang` alternates (en, tr, x-default). Internal links in TR pages point to `/tr/...`. New pages must be added to both languages and to `sitemap.xml` with `xhtml:link` alternates.
2. **Turkish terminology:** değişen madde fonksiyonu (DMF), ölçme değişmezliği, Madde Tepki Kuramı (MTK), bireyselleştirilmiş bilgisayarlı test (BBT), güvenirlik, geçerlik, referans/odak grup, eşik, faktör yükü. Natural academic Turkish, "siz" form. Keep dot decimals in numbers.
3. **Unpublished work stays private.** The AIG (automated item generation) pilot and the Johnson–Neyman (JN) DIF study are unpublished. Describe them only in general terms; no methods, results or novel ideas until published (preprint or journal). A JN-DIF interactive tool is planned for after the preprint.
4. **Accuracy.** Do not claim work she did not do (e.g. she did *not* do automated scoring of oral reading fluency at SMU). Use her CV for facts; ask when unsure.
5. **Citations.** Every method note gets in-text citations, and each topic/tools page ends with a "References / Kaynaklar" list in APA style (references stay in English on TR pages). Verify every new reference against Crossref/publisher records before adding it.
6. **Tool correctness.** Any new or changed calculation must be checked against an independent implementation (e.g. statsmodels, hand computation, or R) before pushing. Each tool shows a "How it is computed" note with formulas and references.
7. **Privacy of visitors.** Tools run entirely in the browser; no uploads, no tracking, no external APIs. Keep it that way unless the owner explicitly asks otherwise.
8. **Light theme only** (the owner did not like the dark theme). No `prefers-color-scheme: dark` blocks.

## Design tokens

- Colors: `--paper #F4F6F5`, `--surface #FFFFFF`, `--ink #13252A`, `--muted #566A6F`, `--rule #D5DEDC`, `--accent #1E6A82` (petrol blue, links/primary), `--curve #C2410C` (burnt orange, data/secondary), `--tint #E6EFEE`. Semantic: good `#2F7D4F`, warn `#A86A00`, bad `#B42318`.
- Type: Spectral (display/headings), IBM Plex Sans (body), IBM Plex Mono (labels, numbers) via Google Fonts.
- Layout: single reading column (max-width ~880–960px), labeled section heads with a mono uppercase eyebrow. Uppercase eyebrows break Greek letters (α → A), so keep Greek out of eyebrows or use `.nocase`.
- Side gutter: `padding-left/right: max(16px, env(safe-area-inset-*))`. Pages must work at 390px width with no horizontal scroll.

## Checking before you push

Serve locally and load every changed page in headless Chromium (desktop 1200px and phone 390px): no page errors, no horizontal overflow, tools still compute.

```
cd public && python3 -m http.server 8790 &
# Playwright: NODE_PATH=$(npm root -g), chromium executablePath /opt/pw-browsers/chromium
```

## Open items

- Turkish names of TÜBİTAK/BAP projects were translated from English; replace with official titles when the owner provides them.
- Three articles (Rational Drug Use, COVID-19 Anxiety, Sports Engagement) show English titles on TR pages; replace with original Turkish titles if they were published in Turkish.
- Ideas discussed: AIG and language/literacy topic pages, a CAT/consulting page, videos/teaching materials, selling training packages (would need a payment platform such as Gumroad/Lemon Squeezy), a JN-DIF tool after publication, a professional e-mail via Cloudflare Email Routing.

## Commits

Commit as the owner's GitHub user (`gozdesrgnc`) with a clear message; end commit messages with the attribution lines the session provides.
