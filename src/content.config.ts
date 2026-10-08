import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { podcastFeedLoader } from './lib/feed';
import { FEED_URL } from './site';

const episodes = defineCollection({
  loader: podcastFeedLoader({ url: FEED_URL }),
  schema: z.object({
    id: z.string(),
    number: z.number().nullable(),
    title: z.string(),
    slug: z.string(),
    pubDate: z.coerce.date(),
    summary: z.string(),
    audioUrl: z.string(),
    audioType: z.string(),
    durationSeconds: z.number().nullable(),
    keywords: z.array(z.string()),
    authors: z.string(),
    podigeeUrl: z.string(),
    transcriptUrl: z.string().nullable(),
  }),
});

export const collections = { episodes };
