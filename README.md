# Portfolio Site

This project is based on the [Payload Website Template](https://github.com/payloadcms/payload/tree/main/templates/website) and has been customized for use as a personal portfolio site.

## What's Changed from the Starter

### Collections

**Added:**
- **Works** - A collection for showcasing professional work/client projects
- **Projects** - A collection for personal projects and experiments

**Removed:**
- **Posts** - The blog/posts collection was removed

**Disabled:**
- **Search** - The search page route is disabled but the functionality remains in place (search plugin, collection, and components in `src/search/`). To re-enable, rename `src/app/(frontend)/_search/` to `src/app/(frontend)/search/` and add the `/search` entry back to the sitemap in `pages-sitemap.xml/route.ts`.

### Blocks

**Added:**
- **Biography** - For displaying bio/about content
- **ProjectsBlock** - Grid display for projects
- **WorksBlock** - Display for work items
- **WorksGridBlock** - Alternative grid layout for works
- **ImageGallery** - Image gallery block
- **RichTextBlock** - Standalone rich text block
- **ComponentBlock** - For embedding custom React components
- **LinksBlock** - For displaying link collections
- **RelatedProjects** - Shows related projects on project detail pages
- **RelatedWorks** - Shows related works on work detail pages

### Heroes

**Added:**
- **HeroSlider** - Animated slider hero with multiple slides
- **ProjectHero** - Hero layout for project detail pages
- **WorkHero** - Hero layout for work detail pages

### Custom Components

**Added:**
- **CascadingGridSlideshow** - Animated grid slideshow effect
- **GlitchTextReveal** - Text reveal with glitch animation
- **GlitchHover** - Glitch effect on hover
- **ImageGlitchPan** - Image with glitch and pan effects
- **HeroSingle** - Single hero image component
- **HeroSlider** - Multi-slide hero component
- **PyramidCubes** - 3D pyramid cubes animation
- **TextOutline** - Outlined text styling
- **WindowReveal** - Window/reveal animation effect
- **BlockNav** - Navigation between blocks
- **SlideshowDemo** - Demo component for slideshow

## Development

1. Copy `.env.example` to `.env` and configure your environment variables
2. `pnpm install && pnpm dev`
3. Open `http://localhost:3000`

### Database

This project uses Postgres. For local development, you can use Docker:

```bash
docker-compose up -d
```

### Migrations

Create a migration:
```bash
pnpm payload migrate:create
```

Run migrations:
```bash
pnpm payload migrate
```

## Deployment

This project is configured for deployment on Vercel with:
- Neon Database (Postgres)
- Vercel Blob Storage (media)

Required environment variables:
- `PAYLOAD_SECRET`
- `CRON_SECRET`
- `PREVIEW_SECRET`
- `POSTGRES_URL`
- `BLOB_READ_WRITE_TOKEN`
