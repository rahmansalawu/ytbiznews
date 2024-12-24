# YouTube Business News Scraper

A Node.js application that scrapes YouTube's business news feed and extracts video information including titles, channel names, and URLs. The data is saved to a CSV file for easy analysis.

## Features

- Automated scraping of YouTube's business news feed
- Extracts video titles, channel names, and URLs
- Handles dynamic content loading through scrolling
- Saves results in CSV format
- Configurable browser settings and timeouts

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the source code
2. Install the dependencies:
```bash
npm install
```

## Usage

To run the scraper:
```bash
npm start
```

The script will:
1. Launch a Chrome browser instance
2. Navigate to YouTube's business news feed
3. Scroll through the page to load more content
4. Extract video information
5. Save the results to `youtube_news_videos.csv` in the project directory

## Configuration

The script includes several configurable options in `index.js`:
- Browser viewport size (default: 1920x1080)
- Page load timeout (default: 60 seconds)
- Number of scroll iterations (default: 3)
- Wait time between scrolls (default: 2 seconds)

## Project Structure

```
├── index.js           # Main script file
├── package.json       # Project dependencies and configuration
└── README.md         # Project documentation
```

## Dependencies

- [Puppeteer](https://pptr.dev/) (v21.6.1) - Headless Chrome Node.js API

## Error Handling

The script includes robust error handling for common scenarios:
- Network timeouts
- Page load failures
- Content selector failures
- CSV writing errors

## Output Format

The CSV file contains the following columns:
- Title: The video title
- Channel: The channel name
- URL: Direct link to the video

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to open issues or submit pull requests for any improvements.
