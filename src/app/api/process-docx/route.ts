import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { file, filename } = await request.json()
    
    const response = await fetch('https://api.gemini.google.com/v1/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "This is a DOCX file. Please extract all the text content from this document and return it as plain text. Remove any formatting and return only the readable content."
            },
            {
              inline_data: {
                mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                data: file
              }
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      throw new Error('Failed to process DOCX with Gemini')
    }

    const result = await response.json()
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return NextResponse.json({ content })
  } catch (error) {
    console.error('DOCX processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process DOCX' },
      { status: 500 }
    )
  }
}