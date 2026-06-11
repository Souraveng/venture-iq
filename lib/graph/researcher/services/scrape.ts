// lib/graph/researcher/services/scrape.ts

export class ScrapeService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || "";
  }

  /**
   * Cleans raw HTML content by removing scripts, styling, navs, headers, footers
   * and converting basic blocks to clean text (fallback scraper)
   */
  private cleanHtml(html: string): string {
    try {
      // 1. Remove comments
      let clean = html.replace(/<!--[\s\S]*?-->/g, "");

      // 2. Remove script and style blocks
      clean = clean.replace(/<script[\s\S]*?<\/script>/g, "");
      clean = clean.replace(/<style[\s\S]*?<\/style>/g, "");

      // 3. Remove navigation, headers, footers, aside, forms, and ad blocks
      clean = clean.replace(/<nav[\s\S]*?<\/nav>/g, "");
      clean = clean.replace(/<header[\s\S]*?<\/header>/g, "");
      clean = clean.replace(/<footer[\s\S]*?<\/footer>/g, "");
      clean = clean.replace(/<aside[\s\S]*?<\/aside>/g, "");
      clean = clean.replace(/<form[\s\S]*?<\/form>/g, "");

      // 4. Extract text content from remaining HTML
      clean = clean.replace(/<\/?[a-zA-Z0-9]+[^>]*>/g, "\n");

      // 5. Clean up multiple spaces and empty lines
      clean = clean
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n");

      // Limit fallback content size to prevent token blowup
      return clean.substring(0, 15000);
    } catch (err) {
      console.error("HTML cleaning failed:", err);
      return html.substring(0, 5000);
    }
  }

  /**
   * Scrapes page content using Firecrawl API, with HTML cleanup fallback
   */
  public async scrape(url: string, retries: number = 2): Promise<string> {
    if (!url) return "";

    let attempt = 0;
    let delay = 1000;

    // 1. Try Firecrawl API if Key exists
    if (this.apiKey) {
      while (attempt < retries) {
        try {
          console.log(`Scraping via Firecrawl: ${url} (Attempt ${attempt + 1}/${retries})`);
          
          const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: url,
              formats: ["markdown"],
            }),
          });

          if (!response.ok) {
            throw new Error(`Firecrawl API returned HTTP status ${response.status}`);
          }

          const data = await response.json();
          if (data && data.success && data.data && data.data.markdown) {
            console.log(`Successfully scraped: ${url} (${data.data.markdown.length} bytes)`);
            return data.data.markdown;
          } else {
            throw new Error("Invalid response format from Firecrawl API");
          }
        } catch (error: any) {
          attempt++;
          console.error(`Firecrawl scraping failed for "${url}": ${error.message || error}`);
          
          if (attempt >= retries) {
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }

    // 2. Fallback Scraper: Raw fetch + semantic tag removal
    try {
      console.log(`Executing fallback HTTP scraper for: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Fallback HTTP request returned status ${response.status}`);
      }

      const html = await response.text();
      const cleanedText = this.cleanHtml(html);
      
      console.log(`Fallback scraper successfully processed URL: ${url} (${cleanedText.length} cleaned characters)`);
      return cleanedText;
    } catch (fallbackError: any) {
      console.error(`Fallback scraper failed for URL "${url}": ${fallbackError.message || fallbackError}`);
      return ""; // Return empty string if both scrape methods fail
    }
  }
}
