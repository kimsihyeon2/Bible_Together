/**
 * 대한성서공회 사이트 구조 테스트
 */
const puppeteer = require('puppeteer');

async function test() {
    console.log('🔍 대한성서공회 사이트 테스트 중...\n');

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // 개역개정 창세기 27:19 테스트
    const url = 'https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=gen&chap=27&sec=19';
    console.log('URL:', url);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // 페이지 내용 가져오기
        const content = await page.evaluate(() => {
            // 모든 텍스트 내용 확인
            const allText = document.body.innerText;
            return {
                title: document.title,
                bodyLength: allText.length,
                bodyPreview: allText.substring(0, 1000)
            };
        });

        console.log('\n=== 페이지 정보 ===');
        console.log('Title:', content.title);
        console.log('Body length:', content.bodyLength);
        console.log('\n=== Body Preview ===\n');
        console.log(content.bodyPreview);

    } catch (error) {
        console.error('에러:', error.message);
    }

    await browser.close();
    console.log('\n✅ 테스트 완료');
}

test().catch(console.error);
