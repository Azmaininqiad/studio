import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, questionCount } = await request.json()
    
    const prompt = `Generate exactly ${questionCount} multiple choice questions based on the following content. 

Content: ${content}

Requirements:
- Create exactly ${questionCount} questions
- Each question should have 4 options (A, B, C, D)
- Only one option should be correct
- Questions should test understanding of the content
- Return the response in this exact JSON format:

{
  "questions": [
    {
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text", 
        "C": "Option C text",
        "D": "Option D text"
      },
      "correct_answer": "A"
    }
  ]
}

Make sure the JSON is valid and follows this exact structure.`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate quiz with Gemini')
    }

    const result = await response.json()
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    let quizData
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No valid JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      throw new Error('Failed to parse quiz data')
    }

    return NextResponse.json(quizData)
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}