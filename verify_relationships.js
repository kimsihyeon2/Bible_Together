
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifySchemaIntegrity() {
    console.log('--- Step 1: Schema Integrity Check (via Client) ---');

    // 1. Check Cells <-> Parishes Integrity
    console.log('Checking Cells -> Parishes references...');
    const { data: cells, error: cellsError } = await supabase.from('cells').select('id, name, parish_id');
    const { data: parishes, error: parishesError } = await supabase.from('parishes').select('id');

    if (cellsError || parishesError) {
        console.error('Error fetching data:', cellsError || parishesError);
        return;
    }

    const parishIds = new Set(parishes.map(p => p.id));
    const orphanCells = cells.filter(c => !parishIds.has(c.parish_id));

    if (orphanCells.length > 0) {
        console.error(`❌ FOUND ${orphanCells.length} ORPHAN CELL(S) (parish_id not found in parishes):`);
        orphanCells.forEach(c => console.log(`   - Cell: ${c.name} (${c.id}) -> Missing Parish: ${c.parish_id}`));
    } else {
        console.log(`✅ All ${cells.length} cells point to valid parishes.`);
    }

    // 2. Check Cell Members -> Cells Integrity
    console.log('\nChecking Cell Members -> Cells references...');
    // Fetch members with their cell data
    // Note: We use !inner or simple select. If database has true FK, joining on a non-existent ID typically returns null for the joined table.
    const { data: members, error: memError } = await supabase
        .from('cell_members')
        .select('user_id, cell_id');

    if (memError) {
        console.error('Error fetching members:', memError);
        return;
    }

    const cellIds = new Set(cells.map(c => c.id));
    const orphanMembers = members.filter(m => !cellIds.has(m.cell_id));

    if (orphanMembers.length > 0) {
        console.error(`❌ FOUND ${orphanMembers.length} ORPHAN MEMBER(S) (cell_id not found in cells):`);
        console.log(`   (Sample: User ${orphanMembers[0].user_id} in Cell ${orphanMembers[0].cell_id})`);
    } else {
        console.log(`✅ All ${members.length} cell_members point to known cells (Client-side verified).`);
    }

    console.log('\nNote: True Database Foreign Key constraints must be verified via SQL Editor using "verify_schema.sql". This script only checks current data consistency.');
}

verifySchemaIntegrity();
