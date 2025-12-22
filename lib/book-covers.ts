export const BOOK_COVERS: Record<string, string> = {
    // 1. 율법서 (Pentateuch)
    '창세기': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop', // Space/Creation
    '출애굽기': 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?q=80&w=800&auto=format&fit=crop', // Desert/Starry Night
    '레위기': 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=800&auto=format&fit=crop', // Fire/Altar
    '민수기': 'https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=800&auto=format&fit=crop', // Wilderness/Desert
    '신명기': 'https://images.unsplash.com/photo-1628510119316-c01379198642?q=80&w=800&auto=format&fit=crop', // Scrolls/Law

    // 2. 역사서 (History)
    '여호수아': 'https://images.unsplash.com/photo-1533158388470-3f749cd97c11?q=80&w=800&auto=format&fit=crop', // Walls/Fortress
    '사사기': 'https://images.unsplash.com/photo-1599590984817-0c15f45b61a0?q=80&w=800&auto=format&fit=crop', // Sword/Battle
    '룻기': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop', // Wheat Field
    '사무엘상': 'https://images.unsplash.com/photo-1590422749842-2b622cb33580?q=80&w=800&auto=format&fit=crop', // Crown/Anointing
    '사무엘하': 'https://images.unsplash.com/photo-1590422749983-a98295982aa0?q=80&w=800&auto=format&fit=crop', // Crown/Throne
    '열왕기상': 'https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?q=80&w=800&auto=format&fit=crop', // Temple/Pillars
    '열왕기하': 'https://images.unsplash.com/photo-1628438459434-29729d4d8430?q=80&w=800&auto=format&fit=crop', // Ruins/History
    '역대상': 'https://images.unsplash.com/photo-1524177218678-02422501a1db?q=80&w=800&auto=format&fit=crop', // Genealogy/Scroll
    '역대하': 'https://images.unsplash.com/photo-1545622152-32b509fd98b7?q=80&w=800&auto=format&fit=crop', // Temple Interior
    '에스라': 'https://images.unsplash.com/photo-1524312686762-b94d13f990a4?q=80&w=800&auto=format&fit=crop', // Rebuilding/Stones
    '느헤미야': 'https://images.unsplash.com/photo-1590625324545-c1fc3455110d?q=80&w=800&auto=format&fit=crop', // Walls/Construction
    '에스더': 'https://images.unsplash.com/photo-1615873968403-89e061852b20?q=80&w=800&auto=format&fit=crop', // Palace/Jewelry

    // 3. 시가서 (Poetry)
    '욥기': 'https://images.unsplash.com/photo-1498842812179-c81beecf902c?q=80&w=800&auto=format&fit=crop', // Storm/Suffering
    '시편': 'https://images.unsplash.com/photo-1511860810434-a92f84c6f01e?q=80&w=800&auto=format&fit=crop', // Harp/Worship/Nature
    '잠언': 'https://images.unsplash.com/photo-1507842217121-e018192a6c6d?q=80&w=800&auto=format&fit=crop', // Light/Book/Wisdom
    '전도서': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', // Vanishing/Mist/Nature
    '아가': 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=800&auto=format&fit=crop', // Rose/Love

    // 4. 선지서 (Prophets)
    '이사야': 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=800&auto=format&fit=crop', // Universe/Throne
    '예레미야': 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=800&auto=format&fit=crop', // Tears/Rain
    '예레미야애가': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop', // Ruins/Sadness
    '에스겔': 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?q=80&w=800&auto=format&fit=crop', // Vision/Wheels (Abstract)
    '다니엘': 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=800&auto=format&fit=crop', // Lion/Night
    '호세아': 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop', // Broken Heart/Nature
    '요엘': 'https://images.unsplash.com/photo-1589416550604-1b774b7123c5?q=80&w=800&auto=format&fit=crop', // Swarm/Locust (Harvest)
    '아모스': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800&auto=format&fit=crop', // Shepherd/Field
    '오바댜': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', // Mountain/High
    '요나': 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop', // Ocean/Storm
    '미가': 'https://images.unsplash.com/photo-1461301214746-1e790926d323?q=80&w=800&auto=format&fit=crop', // Justice/Scale
    '나훔': 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?q=80&w=800&auto=format&fit=crop', // Destruction/Storm
    '하박국': 'https://images.unsplash.com/photo-1501139083538-0139583c61ee?q=80&w=800&auto=format&fit=crop', // Watchtower/Mountain
    '스바냐': 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?q=80&w=800&auto=format&fit=crop', // Day of Lord/Light
    '학개': 'https://images.unsplash.com/photo-1517646287309-48b522ef2365?q=80&w=800&auto=format&fit=crop', // Temple/Foundation
    '스가랴': 'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=800&auto=format&fit=crop', // Horses/Vision
    '말라기': 'https://images.unsplash.com/photo-1470790376778-19997c48dc98?q=80&w=800&auto=format&fit=crop', // Sun/Hope

    // 5. 복음서 (Gospels)
    '마태복음': 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?q=80&w=800&auto=format&fit=crop', // Kingdom/Crown/Food
    '마가복음': 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?q=80&w=800&auto=format&fit=crop', // Servant/Hands/Action
    '누가복음': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop', // Man/Scroll/Healer
    '요한복음': 'https://images.unsplash.com/photo-1491485326079-8713ae1e00a9?q=80&w=800&auto=format&fit=crop', // Light/Word
    '사도행전': 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?q=80&w=800&auto=format&fit=crop', // Map/Journey/Fire

    // 6. 서신서 (Epistles)
    '로마서': 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?q=80&w=800&auto=format&fit=crop', // Ancient Rome/Pillars/Letter
    '고린도전서': 'https://images.unsplash.com/photo-1555445054-848885438e55?q=80&w=800&auto=format&fit=crop', // Community/Love
    '고린도후서': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop', // Comfort/Letter
    '갈라디아서': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop', // Freedom/Chains broken
    '에베소서': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', // Armor/Sky
    '빌립보서': 'https://images.unsplash.com/photo-1499209974431-2761e2052775?q=80&w=800&auto=format&fit=crop', // Joy/Sunrise
    '골로새서': 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=800&auto=format&fit=crop', // Christ Head/Mountains
    '데살로니가전서': 'https://images.unsplash.com/photo-1469041235128-b2586b6a382e?q=80&w=800&auto=format&fit=crop', // Return/Clouds
    '데살로니가후서': 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?q=80&w=800&auto=format&fit=crop', // Endurance/Fire
    '디모데전서': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop', // Leadership/Book
    '디모데후서': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop', // Passing baton/Writing
    '디도서': 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?q=80&w=800&auto=format&fit=crop', // Good Works/Island
    '빌레몬서': 'https://images.unsplash.com/photo-1586027609521-447545b73347?q=80&w=800&auto=format&fit=crop', // Chains/Forgiveness
    '히브리서': 'https://images.unsplash.com/photo-1525715843408-5c6ec44503b1?q=80&w=800&auto=format&fit=crop', // High Priest/Altar
    '야고보서': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=800&auto=format&fit=crop', // Mirror/Action
    '베드로전서': 'https://images.unsplash.com/photo-1523633589114-88eaf4b4f1a8?q=80&w=800&auto=format&fit=crop', // Shepherd/Suffering
    '베드로후서': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop', // Knowledge/Dawn
    '요한일서': 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop', // Love/Light
    '요한이서': 'https://images.unsplash.com/photo-1528716321680-815a8cdb8cbe?q=80&w=800&auto=format&fit=crop', // Truth/Paper
    '요한삼서': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop', // Hospitality/Door
    '유다서': 'https://images.unsplash.com/photo-1466853817435-05b43fe45b39?q=80&w=800&auto=format&fit=crop', // Contend/Waves
    '요한계시록': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop', // Space/Heavenly

    // Fallback
    'default': 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800'
};
