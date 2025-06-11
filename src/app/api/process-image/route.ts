import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { file, filename, mimeType } = await request.json()
    
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
              text: "Extract all text content from this image. If there's no text, describe what you see in the image. Return only the extracted text or description without any additional formatting."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: file
              }
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      throw new Error('Failed to process image with Gemini')
    }

    const result = await response.json()
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Image processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}