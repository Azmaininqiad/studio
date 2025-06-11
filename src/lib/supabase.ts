import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      files: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path: string | null
          extracted_content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path?: string | null
          extracted_content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_type?: string
          file_size?: number
          storage_path?: string | null
          extracted_content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          user_id: string
          file_id: string
          title: string
          description: string | null
          question_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          title?: string
          description?: string | null
          question_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          title?: string
          description?: string | null
          question_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: 'A' | 'B' | 'C' | 'D'
          question_order: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: 'A' | 'B' | 'C' | 'D'
          question_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_answer?: 'A' | 'B' | 'C' | 'D'
          question_order?: number
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          score: number
          total_questions: number
          percentage: number
          completed_at: string
          time_taken: string | null
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          score?: number
          total_questions: number
          completed_at?: string
          time_taken?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          completed_at?: string
          time_taken?: string | null
        }
      }
      user_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_answer: 'A' | 'B' | 'C' | 'D'
          is_correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_answer: 'A' | 'B' | 'C' | 'D'
          is_correct?: boolean
          answered_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_answer?: 'A' | 'B' | 'C' | 'D'
          is_correct?: boolean
          answered_at?: string
        }
      }
    }
  }
}