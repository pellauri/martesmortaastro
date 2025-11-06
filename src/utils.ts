import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

/**
 * Get all published blog posts, filtering out drafts and sorting by publication date (newest first)
 */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
	const posts = await getCollection('blog');
	return posts
		.filter((post) => !post.data.draft && !post.slug.includes('_draft'))
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
