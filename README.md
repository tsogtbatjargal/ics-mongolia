# ICS Mongolia Static Website

Static website for Industrial Control Solutions LLC.

## Cloudflare Pages Deployment

1. In Cloudflare, create a new Pages project from the GitHub repository:
   `tsogtbatjargal/ics-mongolia`.
2. Use these build settings:
   - Production branch: `main`
   - Build command: `exit 0`
   - Build output directory: `.`
3. Deploy the project.
4. Add the custom domain:
   - `icsmongolia.com`

The site is plain static HTML, CSS, JavaScript, and images. It does not require
paid services, databases, WordPress, visitor login, or a build system.

## Routes

- `/` shows the language selector.
- `/en/` shows the English website.
- `/mn/` shows the Mongolian website.

## Pages CMS Editing

Pages CMS is configured in `.pages.yml`.

Editable content mirrors are stored in:

- `content/en.yml`
- `content/mn.yml`

Editors can update company, language, hero, overview, services, snapshots,
approach, team, contact, and footer content in those YAML files. Because the
Cloudflare Pages build command is `exit 0`, YAML edits do not automatically
regenerate the static HTML pages. When content changes, update the matching
HTML in `/en/index.html` and `/mn/index.html` before publishing.
