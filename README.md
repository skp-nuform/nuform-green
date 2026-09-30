# Nuform Green — landing page

Single-page website for **Nuform Green**: compressed biogas (CBG) plants and small CBG projects, green ethanol, green methanol, solar energy, carbon capture (CCUS), carbon footprint & carbon credits, and EPC.

Plain HTML, CSS and JavaScript. No build step, no frameworks, no images to download: every illustration is inline SVG.

## Structure

```
index.html              page content + inline SVG illustrations
assets/css/styles.css   design tokens, light theme + "Eco mode" (dark), responsive rules
assets/js/main.js       interactions (scroll reveals, counters, tabs, gauge, form, theme)
assets/img/favicon.svg  brand mark
```

## Preview locally

Serve the folder with any static server, then open `http://localhost:<port>/`:

```bash
npx serve .
```

## Deploy

Upload the folder to any static host: GitHub Pages (Settings → Pages → deploy from branch `main`, folder `/`), Netlify, Vercel or regular hosting.

## Before going live

- Confirm the founders' titles; photos can replace the initials avatars.
- Contact details (phone, email, Noida address) currently come from nuformsocial.com.
- The policy figures in "Why now" are sourced from PIB press releases dated July–August 2026 (links are in the section). Recheck them periodically.
- The enquiry form opens the visitor's email app. Connect it to a form backend or CRM if needed.
