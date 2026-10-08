import { getCollection } from 'astro:content';

export async function getEpisodes() {
  const episodes = await getCollection('episodes');
  return episodes.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
