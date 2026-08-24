import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const bootSequences = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/bootSequences' }),
  schema: z.object({
    name: z.string(),
    lines: z.array(z.object({
      type: z.enum(['header', 'separator', 'line', 'ok', 'warn']),
      text: z.string().optional(),
      label: z.string().optional(),
      value: z.string().optional(),
    })),
  }),
});

const software = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/software' }),
  schema: ({ image }) => z.object({
    repo: z.string(),
    featured: z.boolean().default(false),
    displayName: z.string(),
    tags: z.array(z.string()).default([]),
    /** One-line description for cards. Falls back to the GitHub description. */
    summary: z.string().optional(),
    screenshots: z.array(z.object({
      src: image(),
      alt: z.string(),
    })).default([]),
    /**
     * Install commands, rendered in order. Server apps get a docker pull;
     * desktop apps get their release asset offered as a download instead.
     */
    install: z.array(z.object({
      label: z.string(),
      command: z.string(),
    })).default([]),
    /**
     * Offer the matching release asset as a download button. The value is
     * matched against asset filenames, so "setup" picks up
     * xeebra-ctrl-setup-0.2.0.exe across versions.
     */
    downloadAsset: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/portfolio' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    company: z.array(z.string()),
    category: z.array(z.string()),
    type: z.enum(['project', 'experience']),
    date: z.string(),
    photo: image().optional(),
    photoPosition: z.string().optional(),
    photoScale: z.number().optional(),
    gradientFrom: z.string().optional(),
    gradientTo: z.string().optional(),
    accentColor: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { bootSequences, software, portfolio, blog };
