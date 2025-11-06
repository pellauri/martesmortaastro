import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	// Filter out draft posts and sort by publication date (newest first)
	const posts = (await getCollection('blog'))
		.filter((post) => !post.slug.includes('_draft'))
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.slug}/`,
		})),
	});
}
