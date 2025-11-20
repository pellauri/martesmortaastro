import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

/**
 * Get all published blog posts, filtering out drafts and sorting by publication date (newest first)
 * @returns Promise resolving to an array of published blog posts, sorted newest to oldest
 */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
	const posts = await getCollection('blog');
	return posts
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
