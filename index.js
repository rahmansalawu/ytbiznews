const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function fetchYoutubeLinks(url) {
    try {
        // Launch a headless browser with additional configurations
        const browser = await puppeteer.launch({ 
            headless: false,  // Set to false to see what's happening
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1920,1080'
            ]
        });
        
        console.log('Browser launched');
        const page = await browser.newPage();

        // Set viewport to a reasonable size
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('Navigating to:', url);
        
        // Use a longer timeout and different wait strategy
        await page.goto(url, {
            waitUntil: 'domcontentloaded', // Changed from networkidle0 to domcontentloaded
            timeout: 60000 // Increased to 60 seconds
        });

        console.log('Initial page load complete, waiting for content...');

        // Wait for some initial content to load
        try {
            await page.waitForSelector('#content', { timeout: 60000 });
            console.log('Main content container found');
        } catch (error) {
            console.log('Timeout waiting for #content, but continuing...');
        }

        // Give the page some time to load dynamic content
        await page.waitForTimeout(5000);
        
        console.log('Scrolling to load more content...');
        
        // Scroll a few times to load more content
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight * 2);
            });
            await page.waitForTimeout(2000); // Increased wait time between scrolls
        }

        // Wait a bit more after scrolling
        await page.waitForTimeout(2000);

        // Extract video information
        const videoInfo = await page.evaluate(() => {
            const videos = document.querySelectorAll('a#thumbnail[href*="watch"]');
            return Array.from(videos).map(anchor => {
                const container = anchor.closest('ytd-rich-item-renderer, ytd-video-renderer');
                if (!container) return null;
                
                const title = container.querySelector('#video-title')?.textContent?.trim() || '';
                const channelName = container.querySelector('#channel-name a, #text > a')?.textContent?.trim() || '';
                
                return {
                    url: anchor.href,
                    title: title,
                    channel: channelName
                };
            }).filter(info => info && info.url && info.title);
        });

        console.log(`Found ${videoInfo.length} videos`);
        
        // Close the browser
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

function saveToCSV(data, filename) {
    // Create CSV header
    const header = ['Title', 'Channel', 'URL'];
    
    // Convert data to CSV rows
    const rows = data.map(video => [
        `"${(video.title || '').replace(/"/g, '""')}"`,
        `"${(video.channel || '').replace(/"/g, '""')}"`,
        `"${video.url}"`
    ]);
    
    // Combine header and rows
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    
    // Write to file
    fs.writeFileSync(filename, csvContent, 'utf-8');
    console.log(`Results saved to ${filename}`);
}

// Use the news destination feed URL
const youtubeUrl = 'https://www.youtube.com/feed/news_destination/business';
const outputFile = path.join(__dirname, 'youtube_news_videos.csv');

fetchYoutubeLinks(youtubeUrl)
    .then(videos => {
        saveToCSV(videos, outputFile);
    })
    .catch(error => {
        console.error('Failed to fetch videos:', error.message);
    });
