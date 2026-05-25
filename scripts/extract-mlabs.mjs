import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SESSION_PATH = path.resolve('reports/mlabs-session.json');

function getLastWeekRange() {
  const today = new Date();
  const currentDay = today.getDay(); // 0: Sunday, 1: Monday, ...
  
  const lastWeekSunday = new Date(today);
  lastWeekSunday.setDate(today.getDate() - currentDay - 7);
  
  const lastWeekSaturday = new Date(today);
  lastWeekSaturday.setDate(today.getDate() - currentDay - 1);
  
  const formatDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  return {
    from: formatDate(lastWeekSunday),
    to: formatDate(lastWeekSaturday)
  };
}

async function run() {
  const dates = getLastWeekRange();
  console.log(`Calculating range: ${dates.from} to ${dates.to}`);

  let storageState;
  if (fs.existsSync(SESSION_PATH)) {
    storageState = SESSION_PATH;
    console.log('Loading saved session state from reports/mlabs-session.json');
  }

  const browser = await chromium.launch({
    headless: false, // Must be headful so we can log in and inspect
  });

  const context = await browser.newContext(storageState ? { storageState } : {});
  const page = await context.newPage();

  console.log('Navigating to mLabs...');
  await page.goto('https://appsocial.mlabs.io/monitoring');

  // Check if we are redirected to login page or need login
  if (page.url().includes('login') || (await page.locator('input[type="email"]').count()) > 0) {
    console.log('--- LOGIN REQUIRED ---');
    console.log('Please log in manually in the opened browser window.');
    console.log('Once you log in and reach the monitoring page, this script will continue and save the session.');
    
    // Wait for navigation or selector indicating dashboard is loaded
    await page.waitForURL(url => url.includes('/monitoring') || url.includes('/dashboard'), { timeout: 300000 });
    console.log('Login detected! Saving session state...');
    
    // Wait 5 seconds to ensure cookies are set
    await page.waitForTimeout(5000);
    await context.storageState({ path: SESSION_PATH });
    console.log('Session state saved to reports/mlabs-session.json');
  } else {
    console.log('Logged in successfully using saved session state.');
  }

  console.log('Waiting for page content to load...');
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (e) {
    console.log('Networkidle timeout, continuing anyway...');
  }

  // Diagnostic mode
  console.log('\n--- DIAGNOSTIC MODE ---');
  console.log('Please locate the date range picker in the browser window and select the date range.');
  console.log('Range to select: Sunday ' + dates.from + ' to Saturday ' + dates.to);
  
  // Print buttons to see what we can click automatically
  const buttons = await page.locator('button').allInnerTexts();
  console.log('Buttons on page:', buttons.slice(0, 20));

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(input => ({
      type: input.type,
      placeholder: input.placeholder,
      value: input.value,
      class: input.className,
      id: input.id
    }));
  });
  console.log('Inputs on page:', inputs);

  console.log('\n--> Select the correct dates (Sunday to Saturday) and click search/apply in the browser.');
  console.log('--> Once the metrics are displayed, press ENTER in the terminal to extract and save them.');
  
  // Wait for user keypress
  await new Promise(resolve => process.stdin.once('data', resolve));

  console.log('Extracting text content from the page...');
  const allText = await page.evaluate(() => document.body.innerText);
  console.log('--- Page text content preview (first 1000 chars) ---');
  console.log(allText.slice(0, 1000));
  
  fs.writeFileSync('reports/diagnostic-text.txt', allText);
  console.log('Saved page text content to reports/diagnostic-text.txt');

  // Let's also grab HTML structure of potential metric cards
  const cardsHTML = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('div, section, article, p, span'));
    return elements
      .filter(el => {
        const txt = el.innerText ? el.innerText.toLowerCase() : '';
        return (txt.includes('alcance') || txt.includes('seguidores') || txt.includes('visualizações') || txt.includes('frequência')) && el.children.length < 5;
      })
      .map(el => ({
        tagName: el.tagName,
        className: el.className,
        innerText: el.innerText.slice(0, 200)
      }));
  });
  
  fs.writeFileSync('reports/diagnostic-elements.json', JSON.stringify(cardsHTML, null, 2));
  console.log('Saved candidate elements to reports/diagnostic-elements.json');

  await browser.close();
  console.log('Diagnostic script finished.');
  process.exit(0);
}

run().catch(console.error);
