import { defineCollection, z } from 'astro:content';
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
  schema: z.object({
    repo: z.string(),
    featured: z.boolean().default(false),
    displayName: z.string(),
    tags: z.array(z.string()).default([]),
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

export const collections = { bootSequences, software, portfolio };
