/**
 * 기존 ko_klb.json과 다운로드한 KLB를 비교하여 패치
 */
const fs = require('fs-extra');
const path = require('path');

async function compareAndPatch() {
    console.log('📖 현대인의 성경 (KLB) 비교 및 패치\n');

    const originalPath = 'public/bible/ko_klb.json';
    const downloadedPath = 'klb_raw.json';

    // 원본 로드
    const original = await fs.readJson(originalPath);
    console.log('원본 (ko_klb.json):');
    console.log('  창세기 1:1:', original['창세기']?.['1']?.['1']?.substring(0, 50));

    // 원본 구조 확인
    const originalBooks = Object.keys(original);
    console.log('  책 수:', originalBooks.length);
    console.log('  책 목록:', originalBooks.slice(0, 5).join(', '), '...');

    // 원본 구절 수 계산
    let originalVerseCount = 0;
    let truncatedVerses = [];

    for (const [book, chapters] of Object.entries(original)) {
        for (const [chapter, verses] of Object.entries(chapters)) {
            for (const [verse, text] of Object.entries(verses)) {
                originalVerseCount++;
                // 잘린 구절 검사 (너무 짧거나 이상하게 끝남)
                if (text.length < 10 || text.endsWith('...') || text.endsWith('?..')) {
                    truncatedVerses.push({
                        key: `${book} ${chapter}:${verse}`,
                        length: text.length,
                        text: text.substring(0, 30)
                    });
                }
            }
        }
    }

    console.log('  구절 수:', originalVerseCount);
    console.log('  의심되는 잘린 구절:', truncatedVerses.length);
    if (truncatedVerses.length > 0) {
        console.log('  예시:');
        truncatedVerses.slice(0, 5).forEach(v => {
            console.log(`    ${v.key}: "${v.text}..." (${v.length}자)`);
        });
    }

    // 다운로드 파일 로드 및 비교
    console.log('\n다운로드 (laisiangtho):');
    const downloaded = await fs.readJson(downloadedPath);

    // laisiangtho 형식: book[id].chapter[num].verse[num].text
    const BOOK_NAMES = {
        '1': '창세기', '2': '출애굽기', '3': '레위기', '4': '민수기', '5': '신명기',
        '6': '여호수아', '7': '사사기', '8': '룻기', '9': '사무엘상', '10': '사무엘하',
        '11': '열왕기상', '12': '열왕기하', '13': '역대상', '14': '역대하',
        '15': '에스라', '16': '느헤미야', '17': '에스더',
        '18': '욥기', '19': '시편', '20': '잠언', '21': '전도서', '22': '아가',
        '23': '이사야', '24': '예레미야', '25': '예레미야애가', '26': '에스겔', '27': '다니엘',
        '28': '호세아', '29': '요엘', '30': '아모스', '31': '오바댜', '32': '요나',
        '33': '미가', '34': '나훔', '35': '하박국', '36': '스바냐', '37': '학개', '38': '스가랴', '39': '말라기',
        '40': '마태복음', '41': '마가복음', '42': '누가복음', '43': '요한복음',
        '44': '사도행전', '45': '로마서', '46': '고린도전서', '47': '고린도후서',
        '48': '갈라디아서', '49': '에베소서', '50': '빌립보서', '51': '골로새서',
        '52': '데살로니가전서', '53': '데살로니가후서', '54': '디모데전서', '55': '디모데후서',
        '56': '디도서', '57': '빌레몬서',
        '58': '히브리서', '59': '야고보서', '60': '베드로전서', '61': '베드로후서',
        '62': '요한1서', '63': '요한2서', '64': '요한3서', '65': '유다서', '66': '요한계시록'
    };

    let downloadedVerseCount = 0;
    let patchedCount = 0;
    let addedCount = 0;

    // 비교 및 패치
    for (const [bookId, bookData] of Object.entries(downloaded.book || {})) {
        const bookName = BOOK_NAMES[bookId];
        if (!bookName) continue;

        const chapters = bookData.chapter || {};
        for (const [chapterNum, chapterData] of Object.entries(chapters)) {
            const verses = chapterData.verse || {};
            for (const [verseNum, verseData] of Object.entries(verses)) {
                const newText = verseData.text || '';
                if (!newText) continue;
                downloadedVerseCount++;

                const currentText = original[bookName]?.[chapterNum]?.[verseNum] || '';

                // 없거나 더 긴 경우 패치
                if (!currentText) {
                    if (!original[bookName]) original[bookName] = {};
                    if (!original[bookName][chapterNum]) original[bookName][chapterNum] = {};
                    original[bookName][chapterNum][verseNum] = newText.trim();
                    addedCount++;
                } else if (newText.length > currentText.length + 5) {
                    // 새 버전이 5자 이상 더 길면 패치
                    original[bookName][chapterNum][verseNum] = newText.trim();
                    patchedCount++;
                }
            }
        }
    }

    console.log('  구절 수:', downloadedVerseCount);
    console.log('  창세기 1:1:', downloaded.book?.['1']?.chapter?.['1']?.verse?.['1']?.text?.substring(0, 50));

    // 결과 저장
    console.log('\n=== 패치 결과 ===');
    console.log('추가된 구절:', addedCount);
    console.log('패치된 구절:', patchedCount);

    if (patchedCount > 0 || addedCount > 0) {
        // 백업 저장
        await fs.copy(originalPath, 'public/bible/ko_klb_backup.json');
        console.log('백업 저장: ko_klb_backup.json');

        // 패치된 파일 저장
        await fs.outputJson(originalPath, original, { spaces: 0 });
        const stats = await fs.stat(originalPath);
        console.log('패치된 파일 크기:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    } else {
        console.log('패치 필요 없음');
    }

    // 샘플 비교
    console.log('\n=== 샘플 비교 ===');
    const samples = [
        ['창세기', '1', '1'],
        ['창세기', '27', '19'],
        ['요한복음', '3', '16'],
        ['시편', '23', '1']
    ];

    for (const [book, ch, v] of samples) {
        const orig = original[book]?.[ch]?.[v]?.substring(0, 40) || '(없음)';
        console.log(`${book} ${ch}:${v}: ${orig}...`);
    }
}

compareAndPatch().catch(console.error);
