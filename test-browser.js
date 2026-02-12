// Quick browser test for Agent Viewer
import puppeteer from 'puppeteer';

const TOKEN = '82071107a060a21dbf6360d20393190bcdaada09697fc6db';
const URL = 'https://openclaw.soyrafa.dev';

async function test() {
  console.log('🚀 Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    console.log('📱 Browser:', msg.text());
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.error('❌ Page error:', error.message);
  });
  
  // Listen for network requests
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/tools/invoke')) {
      const status = response.status();
      console.log(`🌐 API Request: ${status} ${url}`);
      
      if (status === 200) {
        try {
          const data = await response.json();
          console.log('✅ API Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        } catch (e) {
          // ignore
        }
      }
    }
  });
  
  console.log(`📍 Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  
  // Check if we see the token prompt
  const hasTokenPrompt = await page.$('#token-input');
  
  if (hasTokenPrompt) {
    console.log('🔐 Token prompt detected, entering token...');
    await page.type('#token-input', TOKEN);
    await page.click('#token-submit');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Wait a bit for the page to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Take screenshot
  await page.screenshot({ path: '/root/test-projects/my-vite-site/screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved to screenshot.png');
  
  // Check what's on the page
  const agentsList = await page.$('#agents-list');
  if (agentsList) {
    const html = await page.evaluate(el => el.innerHTML, agentsList);
    console.log('📋 Agents list HTML:', html.substring(0, 300));
  }
  
  // Check for errors on page
  const errorToast = await page.$('.error-toast');
  if (errorToast) {
    const errorText = await page.evaluate(el => el.textContent, errorToast);
    console.log('⚠️  Error toast:', errorText);
  }
  
  // Get full page text content
  const bodyText = await page.evaluate(() => document.body.textContent);
  console.log('📄 Page content snippet:', bodyText.substring(0, 500).replace(/\s+/g, ' '));
  
  await browser.close();
  console.log('✅ Test complete!');
}

test().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
