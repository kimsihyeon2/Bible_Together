import { NextRequest, NextResponse } from 'next/server';

// Temporary API route - Supabase integration will be added after deployment
// This is a placeholder until ESM compatibility issues are resolved

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        // TODO: Add Supabase integration after build issues are resolved
        console.log('Urgent prayer request received:', { title, content });

        return NextResponse.json({
            success: true,
            message: 'Prayer request received (database integration pending)',
        });

    } catch (error) {
        console.error('Error in send-push API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        prayers: [],
        message: 'Database integration pending'
    });
}
