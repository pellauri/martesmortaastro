# WordPress Import Implementation - Summary

## Overview
This implementation provides a complete solution for importing historical blog posts from a WordPress XML export file into the Astro-based Martes de Morta blog.

## What Was Implemented

### 1. WordPress Import Script (`import-wordpress.js`)
A comprehensive Node.js script that:
- **Parses WordPress XML** export files using the xml2js library
- **Filters content** to import only published posts (excludes pages, drafts, etc.)
- **Preserves dates** - maintains original publication dates for historical accuracy
- **Extracts structured data**:
  - List of attendees (handles multiple HTML formats: `<li>`, `<br/>`, etc.)
  - Venue/location information
  - Featured images from post content
- **Removes unwanted content** - automatically strips Google Maps links
- **Downloads images** from remote URLs and saves them locally
- **Creates Markdown files** with proper Astro frontmatter
- **Organizes by year** - creates year-based directory structure automatically
- **Security-hardened** - comprehensive HTML sanitization with multiple passes

### 2. Documentation (`IMPORT_INSTRUCTIONS.md`)
Complete Spanish-language documentation including:
- Prerequisites and setup instructions
- Step-by-step import process
- Explanation of what the script does
- Directory structure created
- Post-import verification steps
- Troubleshooting guide

### 3. Helper Script (`download-wordpress-export.sh`)
Bash script that guides users through:
- Downloading the WordPress XML file
- Alternative methods for obtaining the file
- Running the import process

### 4. Configuration Updates
- Added `xml2js` as a dev dependency in package.json
- Created npm script: `npm run import-wordpress`
- Updated `.gitignore` to exclude WordPress XML files
- Updated `README.md` with quick reference

## Technical Details

### Post Format
The script generates Markdown files matching the existing format:

```markdown
---
title: 'N° Martes DD/MM/YYYY'
description: 'N° Martes DD/MM/YYYY'
pubDate: 'Mon DD YYYY'
heroImage: '/Martes/{year}/{file}.jpg'
---

# Asistentes

- Name 1
- Name 2

# Sede

Venue Name

![blog placeholder](/Martes/{year}/{file}.jpg)
```

### Directory Structure
```
src/content/blog/Martes/
├── {year}/
│   ├── {year}_1.md
│   ├── {year}_2.md
│   └── ...

public/Martes/
├── {year}/
│   ├── {year}_1.jpg
│   ├── {year}_2.jpg
│   └── ...
```

### Content Extraction
The script intelligently extracts content from various WordPress HTML formats:

1. **Attendees**:
   - From `<li>` tags in unordered lists
   - From `<br/>` separated names
   - From paragraph-based lists
   - Handles leading markers (-, *, •)

2. **Venue**:
   - Searches for keywords: "Sede", "Lugar", "Local"
   - Removes Google Maps links automatically
   - Cleans up extra text and formatting

3. **Images**:
   - Extracts from `<img>` tags
   - Downloads from remote URLs
   - Names consistently with post files

### Security Features
- **Multi-pass HTML sanitization** - ensures complete tag removal
- **Proper entity decoding** - handles HTML entities in correct order
- **Input validation** - checks file existence and format
- **Error handling** - graceful failure with helpful messages
- **No code injection** - all content properly sanitized

## Usage

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Download the WordPress XML file
# (From https://github.com/pellauri/mortabackup/blob/import-wp/martesdemorta.WordPress.2024-06-05.xml)

# 3. Run the import
npm run import-wordpress martesdemorta.WordPress.2024-06-05.xml

# 4. Verify the results
npm run build
```

### What Happens During Import
1. XML file is parsed
2. Posts are filtered (excludes pages)
3. Posts are sorted by date (oldest first)
4. For each post:
   - Attendees extracted
   - Venue extracted
   - Image downloaded
   - Markdown file created
5. Summary report displayed

## Testing
The implementation was tested with:
- Sample WordPress XML data simulating various HTML formats
- Multiple attendee list formats
- Posts with and without images
- Different venue description formats
- Build verification with imported posts
- Security scanning (CodeQL)

## Limitations & Notes

### Network Access
The actual WordPress XML file could not be accessed during implementation due to:
- Private repository restrictions
- Network security policies in CI environment

**Solution**: User must manually download the file and run the import locally.

### Images
If image downloads fail:
- Script continues with placeholder paths
- User can manually add images later
- Images should be placed in: `public/Martes/{year}/{year}_{number}.jpg`

### Manual Review Recommended
After import:
1. Review generated markdown files
2. Verify attendee lists are correct
3. Check venue information
4. Ensure images are present
5. Validate dates are accurate

## Future Enhancements (Optional)
- Support for WordPress attachments API
- Batch image upload to CDN
- Custom field mapping
- Progress bar for large imports
- Dry-run mode
- Duplicate detection

## Files Modified/Created
- ✅ `import-wordpress.js` - Main import script
- ✅ `IMPORT_INSTRUCTIONS.md` - Documentation
- ✅ `download-wordpress-export.sh` - Helper script
- ✅ `README.md` - Updated with import info
- ✅ `package.json` - Added xml2js and script
- ✅ `package-lock.json` - Updated dependencies
- ✅ `.gitignore` - Exclude XML files

## Success Criteria Met
- ✅ Imports only posts (not pages)
- ✅ Preserves original publication dates
- ✅ Extracts attendee lists
- ✅ Extracts venue information
- ✅ Handles images
- ✅ Removes Google Maps links
- ✅ Matches existing post format
- ✅ Creates year-based structure
- ✅ Comprehensive documentation
- ✅ Security validated (CodeQL)
- ✅ Build verified

## Conclusion
The WordPress import system is complete, tested, secure, and ready for production use. The user needs only to download the WordPress XML file and run the import command to migrate all historical posts into the new Astro blog.
