"""
쉬운성경 텍스트 파일 → JSON 변환 스크립트 (SOTA)
Creates ko_easy.json from extracted txt files
"""
import os
import json
import re

# Book abbreviation to full name mapping
BOOK_ABBR_TO_NAME = {
    # 구약 39권
    '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
    '수': '여호수아', '삿': '사사기', '룻': '룻기', '삼상': '사무엘상', '삼하': '사무엘하',
    '왕상': '열왕기상', '왕하': '열왕기하', '대상': '역대상', '대하': '역대하',
    '스': '에스라', '느': '느헤미야', '에': '에스더', '욥': '욥기', '시': '시편',
    '잠': '잠언', '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야',
    '애': '예레미야애가', '겔': '에스겔', '단': '다니엘', '호': '호세아', '욜': '요엘',
    '암': '아모스', '옵': '오바댜', '욘': '요나', '미': '미가', '나': '나훔',
    '합': '하박국', '습': '스바냐', '학': '학개', '슥': '스가랴', '말': '말라기',
    # 신약 27권
    '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음', '행': '사도행전',
    '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서', '갈': '갈라디아서',
    '엡': '에베소서', '빌': '빌립보서', '골': '골로새서', '살전': '데살로니가전서',
    '살후': '데살로니가후서', '딤전': '디모데전서', '딤후': '디모데후서', '딛': '디도서',
    '몬': '빌레몬서', '히': '히브리서', '약': '야고보서', '벧전': '베드로전서',
    '벧후': '베드로후서', '요일': '요한1서', '요이': '요한2서', '요삼': '요한3서',
    '유': '유다서', '계': '요한계시록'
}

# Expected book order
BOOK_ORDER = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기',
    '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야',
    '에스더', '욥기', '시편', '잠언', '전도서', '아가', '이사야', '예레미야', '예레미야애가',
    '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔',
    '하박국', '스바냐', '학개', '스가랴', '말라기',
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전', '로마서', '고린도전서',
    '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서',
    '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서',
    '야고보서', '베드로전서', '베드로후서', '요한1서', '요한2서', '요한3서', '유다서', '요한계시록'
]

def parse_verse_ref(text):
    """Parse verse reference like '창1:1' → ('창세기', 1, 1)"""
    # Match pattern like 창1:1 or 삼상1:1 or 요일1:1
    match = re.match(r'^([가-힣]+)(\d+):(\d+)\s*(.*)$', text)
    if match:
        abbr = match.group(1)
        chapter = int(match.group(2))
        verse = int(match.group(3))
        content = match.group(4)
        
        book_name = BOOK_ABBR_TO_NAME.get(abbr)
        if book_name:
            return book_name, chapter, verse, content
    return None, None, None, None

def main():
    print('🚀 쉬운성경 텍스트 → JSON 변환 시작\n')
    
    base_dir = 'temp_easy_bible'
    bible_data = {}
    
    # Stats
    total_verses = 0
    books_found = set()
    
    # Process all txt files
    for root, dirs, files in os.walk(base_dir):
        for filename in sorted(files):
            if not filename.endswith('.txt'):
                continue
            
            filepath = os.path.join(root, filename)
            
            try:
                with open(filepath, 'r', encoding='cp949') as f:
                    content = f.read()
            except:
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as e:
                    print(f'❌ 읽기 실패: {filename} - {e}')
                    continue
            
            lines = content.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                book_name, chapter, verse, text = parse_verse_ref(line)
                
                if book_name and text:
                    # Initialize book if needed
                    if book_name not in bible_data:
                        bible_data[book_name] = {}
                    
                    # Initialize chapter if needed
                    ch_key = str(chapter)
                    if ch_key not in bible_data[book_name]:
                        bible_data[book_name][ch_key] = {}
                    
                    # Add verse
                    v_key = str(verse)
                    bible_data[book_name][ch_key][v_key] = text.strip()
                    
                    total_verses += 1
                    books_found.add(book_name)
    
    print(f'📊 통계:')
    print(f'   총 책: {len(books_found)}/66')
    print(f'   총 절: {total_verses}')
    
    # Check missing books
    missing_books = set(BOOK_ORDER) - books_found
    if missing_books:
        print(f'\n⚠️ 누락된 책: {missing_books}')
    
    # Order books correctly
    ordered_data = {}
    for book in BOOK_ORDER:
        if book in bible_data:
            ordered_data[book] = bible_data[book]
    
    # Save JSON
    output_path = 'public/bible/ko_easy.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(ordered_data, f, ensure_ascii=False, separators=(',', ':'))
    
    file_size = os.path.getsize(output_path) / 1024 / 1024
    
    print(f'\n✅ 변환 완료!')
    print(f'   파일: {output_path}')
    print(f'   크기: {file_size:.2f} MB')
    
    # Verify sample verses
    print('\n📖 샘플 확인:')
    samples = [('창세기', '1', '1'), ('미가', '5', '1'), ('요한복음', '3', '16')]
    for book, ch, v in samples:
        text = ordered_data.get(book, {}).get(ch, {}).get(v, '(없음)')
        print(f'   {book} {ch}:{v}: {text[:50]}...')

if __name__ == '__main__':
    main()
