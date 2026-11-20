# Nihal R · Robotics portfolio

A dependency-free Node static site and a separate Sanity Studio. The public site builds complete HTML, including project URLs, from published content. Sanity Studio uses Sanity sign-in and project membership for editing. The only browser scripts in the public build handle the mobile menu and project filters.

## Run locally

From this folder, use Node.js 22 or later.

```sh
node --test
node build.mjs
node serve.mjs
```

Open http://127.0.0.1:4173/. Run the build again after changing content. The source includes an approved starter profile, portrait, and certificate. The local project library includes the 12-DOF Quadruped Robotic Platform, VectorDrive, GeoNavigator, and ODIN. CMS builds read the published projects from Sanity. The workspace copy has your original résumé at `public/media/resume.pdf`. That PDF is ignored by Git and is only included in local-mode builds. To restore a PDF in a clean local checkout, copy your public-ready résumé to that path.

## Set up the editor

1. Create a Sanity project and a dataset, for example `production`. A public dataset works on Free. Its published documents can be queried by anyone, including fields hidden by website display toggles. Leave sensitive fields blank or use a private dataset on a plan that supports one. Any regular dataset image or file can be opened by anyone with its CDN URL, even when linked only from a draft. Upload media and PDFs that you are comfortable making public. The original résumé includes a phone number, so review the PDF before uploading it.
2. Copy `studio/.env.example` to `studio/.env` and fill in the project ID and dataset. These identifiers are public configuration. Inside `studio`, use Node 24 and pnpm 11. Run `pnpm install --frozen-lockfile` and `pnpm exec sanity login`.
3. From `studio`, create the two starter documents once. The import is deliberately run without a replace flag.
   ```sh
   node seed.mjs > seed.ndjson
   pnpm exec sanity dataset import seed.ndjson production
   ```
   Replace `production` with your dataset. Run the redirection in a UTF-8 shell, such as PowerShell 7. This creates the profile and certificate. To load the repository projects into Sanity separately, run these commands from `studio` in PowerShell 7:

   ```powershell
   node seed.mjs --projects > seed.ndjson
   pnpm exec sanity dataset import seed.ndjson production --missing
   ```

   Run the project import once for a dataset. It includes the README content and uploads the project covers to Sanity. Delete the generated NDJSON after importing.
4. Run `pnpm dev`, sign in, open **Portfolio settings**, upload the portrait and your public-ready résumé PDF, then publish. Choose one résumé source. An uploaded file takes priority over an external HTTPS URL. For a hosted editor run `pnpm run deploy`, then use the Studio URL it prints. Sanity manages sign-in and membership. Keep access limited to your account and intended collaborators. If local sign-in reports a CORS error, allow the exact Studio origin with credentials in the Sanity project settings.
5. In **Projects**, create a blank project or choose **Engineering case study outline** from the new-document menu. Add a unique slug, status, category, cover and alt text, and drag blocks to reorder them. Use the **Draft preview** tab to review the case study in Studio. Duplicate an existing project as a starting point and generate a fresh slug before publishing. Keep a published slug stable to preserve its URL. Choose and order featured projects under Portfolio settings, or use the individual featured flags and sort orders. Category and tag names are editable project fields. Use consistent spellings for discovery filters. Skills groups can reference published projects.
6. Use **Certificates** for workshop and certificate records. Portfolio settings controls the homepage, About, skills, education and experience, public contact links, and résumé.

## Build from Sanity and enable GitHub Pages

Set `SANITY_PROJECT_ID` and `SANITY_DATASET` in your shell to try a CMS-backed build locally. Set a read-only `SANITY_READ_TOKEN` only for a private dataset. Studio uses its own Sanity login. The site queries the non-CDN API with the published perspective at build time and keeps credentials out of generated files. A failed query stops the build and leaves the last deployed site available.

1. Push this folder as the root of a GitHub repository on branch `main`. In **Settings → Pages**, select **GitHub Actions**. GitHub Free supports Pages from a public repository.
2. In **Settings → Secrets and variables → Actions**, set repository variables `SANITY_PROJECT_ID` and `SANITY_DATASET`. For a private dataset only, add the read-only token as the `SANITY_READ_TOKEN` Actions secret. The Pages workflow supplies the site origin and repository base path for assets, canonicals, and sitemap. For manual builds you can set `SITE_ORIGIN` (for example `https://owner.github.io`) and `BASE_PATH` (for example `/portfolio`, or empty at a domain root).
3. Run **Actions → Publish portfolio → Run workflow** and open the deployed URL from the Pages job. Builds also run on pushes to `main`.
4. To rebuild from Sanity, create a fine-grained GitHub token scoped to this one repository with **Actions: write** and an expiry. Keep it in the Sanity webhook Authorization header. This permission allows workflow dispatch and other Actions writes for the selected repository. Use a short expiry and rotate it in Sanity before it lapses.
5. In Sanity, create a POST webhook for the portfolio dataset. Use `https://api.github.com/repos/OWNER/REPO/actions/workflows/pages.yml/dispatches` and enable create, update, and delete events. Keep draft and version events disabled. Add the Authorization header with value `Bearer <your fine-grained token>`, plus `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`. Use this filter and projection.

   Filter
   ```groq
   coalesce(after()._type, before()._type) in ["profile", "project", "certificate"]
   ```

   Projection
   ```groq
   {"ref": "main"}
   ```

GitHub Pages serves the generated files. The webhook calls GitHub’s API directly, and the workflow rebuilds all pages, including on unpublish and delete. The dispatch projection sends only the branch name. Standard YouTube watch and short URLs display an inline player and a fallback link. Other HTTPS video URLs are linked directly.

Sanity currently lists two webhooks, 250,000 monthly API requests, and 100 GB each of asset storage and monthly bandwidth on Free. GitHub lists a 1 GB published Pages limit and a soft monthly bandwidth limit of 100 GB. Recheck the linked plan and usage limits when creating the accounts.

## Verify and recover

- In a test dataset, save a project draft and verify it appears in Studio preview while absent from a CMS-backed build. Publish it and confirm its listing and direct URL. Edit the summary, publish, and confirm the update. Unpublish and confirm that a successful redeploy removes the card and serves the 404 at the old URL. Repeat for delete.
- If nothing deploys, check Sanity’s webhook attempts for the GitHub HTTP status and check **Actions** for the build. A 401/403 usually indicates a missing, expired, or under-scoped credential. A 404 can indicate the workflow is absent from the default branch, or the token lacks repository access. Check the Sanity project, dataset, and published settings if the build fails. Fix the cause and run the workflow manually.
- For content recovery, restore the desired document revision in Studio and publish it again. For a source regression, revert the source commit on the default branch. An unsuccessful build does not upload a new Pages artifact.
- Provider references: [Sanity plans](https://www.sanity.io/pricing), [Studio hosting](https://www.sanity.io/docs/studio/deployment), [asset visibility](https://www.sanity.io/docs/content-lake/manage-assets), [webhooks](https://www.sanity.io/docs/content-lake/webhooks), [GitHub workflow dispatch](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event), [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), and [Actions security](https://docs.github.com/en/actions/reference/security/secure-use).


