#!/usr/bin/env node

/**
 * WordPress XML to Astro Blog Post Importer
 * 
 * This script imports blog posts from a WordPress XML export file
 * and converts them to Astro-compatible Markdown files.
 * 
 * Usage: node import-wordpress.js <path-to-wordpress-xml-file>
 */

import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';
import https from 'https';
import http from 'http';

// Configuration
const CONTENT_DIR = './src/content/blog/Martes';
const PUBLIC_DIR = './public/Martes';

/**
 * Parse the WordPress XML export file
 */
async function parseWordPressXML(xmlFilePath) {
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');
    const result = await parseStringPromise(xmlContent);
    return result;
}

/**
 * Extract posts from parsed XML (excluding pages)
 */
function extractPosts(parsedXML) {
    const channel = parsedXML.rss.channel[0];
    const items = channel.item || [];
    
    // Filter only posts (not pages)
    const posts = items.filter(item => {
        const postType = item['wp:post_type'] ? item['wp:post_type'][0] : '';
        const status = item['wp:status'] ? item['wp:status'][0] : '';
        return postType === 'post' && status === 'publish';
    });
    
    console.log(`Found ${items.length} total items, ${posts.length} published posts`);
    return posts;
}

/**
 * Parse post date from WordPress format
 */
function parsePostDate(dateString) {
    // WordPress dates are typically in format: "Wed, 05 Jun 2024 10:30:00 +0000"
    const date = new Date(dateString);
    return date;
}

/**
 * Format date for Astro frontmatter (e.g., "Jan 02 2024")
 */
function formatAstroDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day} ${year}`;
}

/**
 * Format date for display in title (e.g., "5/06/2024")
 */
function formatDisplayDate(date) {
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Extract attendees from post content
 */
function extractAttendees(content) {
    const attendees = [];
    
    if (!content) return attendees;
    
    // First, extract text from <li> tags specifically
    const liMatches = content.matchAll(/<li[^>]*>(.*?)<\/li>/gi);
    for (const match of liMatches) {
        let name = match[1].replace(/<[^>]*>/g, '').trim();
        if (name && name.length > 0 && name.length < 50) {
            attendees.push(name);
        }
    }
    
    // If we found attendees in <li> tags, return them
    if (attendees.length > 0) {
        return attendees;
    }
    
    // Otherwise, try other patterns
    // Remove HTML tags but keep line breaks (convert br to single newline)
    let text = content.replace(/<br\s*\/?>\s*/gi, '\n')
                      .replace(/<\/p>\s*/gi, '\n')
                      .replace(/<[^>]*>/g, '')
                      .trim();
    
    // Look for section with "Asistentes" or similar
    // Look more broadly to capture all content between Asistentes and the next section
    const asistenteMatch = text.match(/asistentes?:?\s*([\s\S]*?)(?=sede|lugar|local|foto|$)/i);
    if (asistenteMatch) {
        const section = asistenteMatch[1].trim();
        const lines = section.split('\n');
        
        for (let line of lines) {
            line = line.trim();
            // Remove leading markers like -, *, •
            line = line.replace(/^[-*•]\s*/, '');
            // Skip empty lines and lines that look like headers or have URLs
            if (line && 
                line.length > 0 && 
                line.length < 50 && 
                !line.match(/^(sede|lugar|local|foto)s?:?$/i) &&
                !line.match(/https?:\/\//)) {
                attendees.push(line);
            }
        }
    }
    
    return attendees;
}

/**
 * Extract venue/location from post content
 */
function extractVenue(content) {
    if (!content) return 'Por determinar';
    
    // Remove HTML tags but keep structure
    let text = content.replace(/<br\s*\/?>/gi, '\n')
                      .replace(/<\/p>/gi, '\n\n')
                      .replace(/<[^>]*>/g, '')
                      .trim();
    
    // Look for section with "Sede", "Lugar", "Local" etc.
    const sedeMatch = text.match(/(?:sede|lugar|local):?\s*([^\n]+)/i);
    if (sedeMatch) {
        let venue = sedeMatch[1].trim();
        // Remove Google Maps links if present
        venue = venue.replace(/https?:\/\/[^\s]+/g, '').trim();
        // Clean up parentheses or extra text after the venue
        venue = venue.replace(/\([^)]*\)/g, '').trim();
        return venue || 'Por determinar';
    }
    
    return 'Por determinar';
}

/**
 * Extract image URL from post content or featured image
 */
function extractImageUrl(item) {
    // Try featured image first
    const content = item['content:encoded'] ? item['content:encoded'][0] : '';
    
    // Look for image tags
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
        return imgMatch[1];
    }
    
    // Look for direct links to images
    const linkMatch = content.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif)/i);
    if (linkMatch) {
        return linkMatch[0];
    }
    
    return null;
}

/**
 * Download image from URL
 */
async function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        // Create directory if it doesn't exist
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const file = fs.createWriteStream(destPath);
        
        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(destPath);
                });
            } else {
                file.close();
                if (fs.existsSync(destPath)) {
                    fs.unlinkSync(destPath);
                }
                reject(new Error(`Failed to download image: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
            reject(err);
        });
    });
}

/**
 * Calculate week number of the year
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Create Markdown file for a post
 */
async function createPostFile(post, index) {
    try {
        // Extract post data
        const title = post.title ? post.title[0] : 'Sin título';
        const pubDateStr = post.pubDate ? post.pubDate[0] : post['wp:post_date'] ? post['wp:post_date'][0] : null;
        const content = post['content:encoded'] ? post['content:encoded'][0] : '';
        
        if (!pubDateStr) {
            console.warn(`Skipping post without date: ${title}`);
            return null;
        }
        
        const pubDate = parsePostDate(pubDateStr);
        const year = pubDate.getFullYear();
        const weekNum = getWeekNumber(pubDate);
        
        // Extract structured data
        const attendees = extractAttendees(content);
        const venue = extractVenue(content);
        const imageUrl = extractImageUrl(post);
        
        // Generate filename based on year and week/sequence
        const filename = `${year}_${index + 1}.md`;
        const imageName = `${year}_${index + 1}.jpg`;
        
        // Create directory structure
        const yearDir = path.join(CONTENT_DIR, year.toString());
        const publicYearDir = path.join(PUBLIC_DIR, year.toString());
        
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir, { recursive: true });
            console.log(`Created directory: ${yearDir}`);
        }
        
        if (!fs.existsSync(publicYearDir)) {
            fs.mkdirSync(publicYearDir, { recursive: true });
            console.log(`Created directory: ${publicYearDir}`);
        }
        
        // Download image if available
        let heroImagePath = '';
        if (imageUrl && !imageUrl.includes('maps.google')) {
            try {
                const imageDestPath = path.join(publicYearDir, imageName);
                await downloadImage(imageUrl, imageDestPath);
                heroImagePath = `/Martes/${year}/${imageName}`;
                console.log(`Downloaded image: ${imageName}`);
            } catch (error) {
                console.warn(`Failed to download image for ${filename}: ${error.message}`);
                heroImagePath = `/Martes/${year}/${imageName}`;
            }
        } else {
            heroImagePath = `/Martes/${year}/${imageName}`;
        }
        
        // Generate markdown content
        const displayDate = formatDisplayDate(pubDate);
        const astroDate = formatAstroDate(pubDate);
        
        let markdown = `---
title: '${index + 1}° Martes ${displayDate}'
description: '${index + 1}° Martes ${displayDate}'
pubDate: '${astroDate}'
heroImage: '${heroImagePath}'
---

# Asistentes

`;
        
        if (attendees.length > 0) {
            attendees.forEach(attendee => {
                markdown += `- ${attendee}\n`;
            });
        } else {
            markdown += '- Por confirmar\n';
        }
        
        markdown += `
# Sede

${venue}

![blog placeholder](${heroImagePath})`;
        
        // Write markdown file
        const postPath = path.join(yearDir, filename);
        fs.writeFileSync(postPath, markdown, 'utf-8');
        console.log(`Created post: ${postPath}`);
        
        return {
            filename,
            year,
            title,
            date: pubDate
        };
    } catch (error) {
        console.error(`Error creating post file:`, error);
        return null;
    }
}

/**
 * Main import function
 */
async function importWordPress(xmlFilePath) {
    try {
        console.log('Starting WordPress import...');
        console.log(`Reading XML file: ${xmlFilePath}`);
        
        // Parse XML
        const parsedXML = await parseWordPressXML(xmlFilePath);
        
        // Extract posts
        const posts = extractPosts(parsedXML);
        
        if (posts.length === 0) {
            console.log('No posts found to import.');
            return;
        }
        
        // Sort posts by date (oldest first)
        posts.sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate[0]) : new Date(a['wp:post_date'][0]);
            const dateB = b.pubDate ? new Date(b.pubDate[0]) : new Date(b['wp:post_date'][0]);
            return dateA - dateB;
        });
        
        // Group posts by year
        const postsByYear = {};
        posts.forEach(post => {
            const pubDateStr = post.pubDate ? post.pubDate[0] : post['wp:post_date'] ? post['wp:post_date'][0] : null;
            if (pubDateStr) {
                const year = new Date(pubDateStr).getFullYear();
                if (!postsByYear[year]) {
                    postsByYear[year] = [];
                }
                postsByYear[year].push(post);
            }
        });
        
        // Process each year
        console.log(`\nProcessing ${posts.length} posts across ${Object.keys(postsByYear).length} years...`);
        
        let totalCreated = 0;
        for (const [year, yearPosts] of Object.entries(postsByYear)) {
            console.log(`\n--- Processing year ${year} (${yearPosts.length} posts) ---`);
            
            for (let i = 0; i < yearPosts.length; i++) {
                const result = await createPostFile(yearPosts[i], i);
                if (result) {
                    totalCreated++;
                }
            }
        }
        
        console.log(`\n✅ Import complete! Created ${totalCreated} posts.`);
        console.log('\nNext steps:');
        console.log('1. Review the generated markdown files');
        console.log('2. Add missing images to the public/Martes/ directories');
        console.log('3. Verify the content is correct');
        console.log('4. Run "npm run build" to build the site');
        
    } catch (error) {
        console.error('Error during import:', error);
        process.exit(1);
    }
}

// Main execution
if (process.argv.length < 3) {
    console.error('Usage: node import-wordpress.js <path-to-wordpress-xml-file>');
    console.error('Example: node import-wordpress.js ./martesdemorta.WordPress.2024-06-05.xml');
    process.exit(1);
}

const xmlFilePath = process.argv[2];

if (!fs.existsSync(xmlFilePath)) {
    console.error(`Error: File not found: ${xmlFilePath}`);
    process.exit(1);
}

importWordPress(xmlFilePath);
