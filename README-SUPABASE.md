# Welcome to InterviewLab!

To run this application, you need to set up your backend via **Supabase**.

## 1. Supabase Setup
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the `supabase_schema.sql` file located in this project and paste its contents into the SQL Editor. Click **Run**.
4. Go to **Project Settings -> API** in Supabase.
5. Copy the `Project URL` and the `anon` `public` key.

## 2. Environment Variables
Create a file named `.env.local` in the root of the project (`f:\Raj\My Project\InterviewLab\.env.local`) and add the following keys:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

*(Note: The Gemini API Key is required if you want to use the AI Question Generator. If not provided, the app will insert mock questions to prevent crashes).*

## 3. Running the App
Once your `.env.local` is ready:
1. Open your terminal in this project directory.
2. Run `npm run dev`.
3. Go to `http://localhost:3000` to start exploring!
