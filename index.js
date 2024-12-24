/**
 * YouTube Business News Scraper
 * This script automates the process of scraping video information from YouTube's business news feed.
 * It uses Puppeteer for browser automation and saves the results in a CSV format.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Fetches video information from a YouTube page
 * @param {string} url - The YouTube URL to scrape
 * @returns {Promise<Array<{url: string, title: string, channel: string}>>} Array of video information objects
 * @throws {Error} If there's an issue with browser automation or page loading
 */
async function fetchYoutubeLinks(url) {
    try {
        // Launch a headless browser with additional configurations for stability
        const browser = await puppeteer.launch({ 
            headless: false,  // Visible browser for debugging
            args: [
                '--no-sandbox',           // Required for some environments
                '--disable-setuid-sandbox',// Additional security flag
                '--window-size=1920,1080' // Set consistent window size
            ]
        });
        
        console.log('Browser launched');
        const page = await browser.newPage();

        // Configure viewport for consistent rendering
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('Navigating to:', url);
        
        // Navigate to the target URL with extended timeout for slower connections
        await page.goto(url, {
            waitUntil: 'domcontentloaded', // Less strict than networkidle0 for better reliability
            timeout: 60000 // 60 second timeout for slow connections
        });

        console.log(`Initial page load complete, waiting for content...`);
        
        // Wait for the main content container to ensure page is interactive
        try {
            await page.waitForSelector('#content', { timeout: 60000 });
            console.log('Main content container found');
        } catch (error) {
            console.log('Timeout waiting for #content, but continuing...');
        }

        // Allow time for dynamic content to load
        await page.waitForTimeout(5000);
        
        console.log('Scrolling to load more content...');
        
        // Simulate scrolling to trigger lazy loading of more videos
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight * 2);
            });
            await page.waitForTimeout(2000); // Wait between scrolls to allow content to load
        }

        // Additional wait time for final content load
        await page.waitForTimeout(2000);

        // Extract video information using page evaluation
        const videoInfo = await page.evaluate(() => {
            // Select all video thumbnail links
            const videos = document.querySelectorAll('a#thumbnail[href*="watch"]');
            return Array.from(videos).map(anchor => {
                // Find the parent container for each video
                const container = anchor.closest('ytd-rich-item-renderer, ytd-video-renderer');
                if (!container) return null;
                
                // Extract title and channel information
                const title = container.querySelector('#video-title')?.textContent?.trim() || '';
                const channelName = container.querySelector('#channel-name a, #text > a')?.textContent?.trim() || '';
                
                return {
                    url: anchor.href,
                    title: title,
                    channel: channelName
                };
            }).filter(info => info && info.url && info.title); // Filter out invalid entries
        });

        console.log(`Found ${videoInfo.length} videos`);
        
        // Clean up resources
        await browser.close();
        
        return videoInfo;
    } catch (error) {
        console.error('Error:', error.message);
        if (error.message.includes('timeout')) {
            console.log('Tip: Your internet connection might be slow or YouTube is taking longer to respond than usual.');
        }
        throw error;
    }
}

/**
 * Saves video information to a CSV file
 * @param {Array<{url: string, title: string, channel: string}>} data - Array of video information
 * @param {string} filename - Path to the output CSV file
 */
function saveToCSV(data, filename) {
    // Define CSV structure
    const header = ['Title', 'Channel', 'URL'];
    
    // Convert video data to CSV format, escaping quotes in text
    const rows = data.map(video => [
        `"${(video.title || '').replace(/"/g, '""')}"`,
        `"${(video.channel || '').replace(/"/g, '""')}"`,
        `"${video.url}"`
    ]);
    
    // Combine header and data rows
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    
    // Write to file
    fs.writeFileSync(filename, csvContent, 'utf-8');
    console.log(`Results saved to ${filename}`);
}

/**
 * Removes duplicate entries from CSV data and saves to the same file
 * @param {string} filename - Path to the CSV file
 */
function removeDuplicates(filename) {
    console.log('Removing duplicates from CSV...');
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n');
    
    // Get headers and data
    const headers = lines[0];
    const dataLines = lines.slice(1);
    
    // Use Set to store unique lines
    const uniqueLines = new Set(dataLines);
    
    // Combine headers with unique data lines
    const outputContent = [headers, ...uniqueLines].join('\n');
    
    // Write back to the same file
    fs.writeFileSync(filename, outputContent);
    
    console.log(`Original number of rows: ${dataLines.length}`);
    console.log(`Rows after removing duplicates: ${uniqueLines.size}`);
    console.log(`Number of duplicates removed: ${dataLines.length - uniqueLines.size}`);
}

// Configuration
const youtubeUrl = 'https://www.youtube.com/feed/news_destination/business';
const outputFile = path.join(__dirname, 'youtube_news_videos.csv');

// Main execution
(async () => {
    try {
        console.log('Starting YouTube business news scraper...');
        const videoInfo = await fetchYoutubeLinks(youtubeUrl);
        await saveToCSV(videoInfo, outputFile);
        removeDuplicates(outputFile);
        console.log('Process completed successfully!');
    } catch (error) {
        console.error('Failed to complete the process:', error);
        process.exit(1);
    }
})();
