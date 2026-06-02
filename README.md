
  # User ideation tool

  This is a code bundle for User ideation tool. The original project is available at https://www.figma.com/design/JBeJYP0lieYkcNsPQolM8v/User-ideation-tool.

  ## Running the code

  Run `pnpm install` to install the dependencies.

  Run `pnpm run dev` to start the development server.

  ## Building for production

  Run `pnpm run build` to produce a static site in the `dist/` directory.

  ## Deploying to GitHub Pages

  This repository includes a GitHub Actions workflow
  (`.github/workflows/deploy.yml`) that builds the app and deploys it to
  GitHub Pages automatically on every push to `main`.

  To enable it:

  1. Go to **Settings → Pages** in the repository.
  2. Under **Build and deployment → Source**, select **GitHub Actions**.
  3. Push to `main` (or run the workflow manually from the **Actions** tab).

  The site is served from `https://<user>.github.io/Flake/`. The Vite `base`
  path is set to `/Flake/` to match the repository name. If you deploy under a
  different path (for example a user/organization page or a custom domain), set
  the `BASE_PATH` environment variable when building, e.g. `BASE_PATH=/ pnpm run
  build`.
  