# 📋 Environment Variables Guide

## **Quick Answer: How Many API Keys?**

### **Minimum Required (Course Generation Works):**
- 1 Gemini API key
- 1 Supabase key

### **Recommended Setup (Best Performance):**
- 2-3 Gemini API keys (for load balancing)
- 1 Supabase key
- 1 ElevenLabs key (optional - for audio)
- 1 Brave key (optional - for resources)

---

## **📝 Complete .env File Format**

Create `backend/.env` with this exact format:

```env
# ============================================
# REQUIRED - Minimum Setup
# ============================================

# Supabase (REQUIRED)
SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Gemini API (REQUIRED - At least 1)
GEMINI_API_KEY=your_gemini_api_key_here
# OR use numbered keys:
GEMINI_API_KEY_1=your_first_key
GEMINI_API_KEY_2=your_second_key
GEMINI_API_KEY_3=your_third_key

# ============================================
# OPTIONAL - For Complete Features
# ============================================

# ElevenLabs (Optional - for audio generation)
ELEVENLABS_API_KEY=sk_your_elevenlabs_key_here

# Brave Search (Optional - for external resources)
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here

# Groq (Optional - for interview coach)
GROQ_API_KEY=your_groq_key_here
```

---

## **🔑 API Key Requirements Explained**

### **1. Supabase (REQUIRED) ✅**
```
SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (long JWT token)
```
- **Where to get**: Supabase Dashboard → Settings → API → Service Role Key
- **Purpose**: Database access for storing courses, chapters, progress

### **2. Gemini API (REQUIRED) ✅**
```
# Minimum: 1 key
GEMINI_API_KEY=AIzaSy...

# Recommended: 2-3 keys (for load balancing)
GEMINI_API_KEY_1=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
```
- **Where to get**: https://makersuite.google.com/app/apikey
- **Purpose**: AI content generation (chapters, quizzes, flashcards)
- **Free tier**: Yes (60 requests/min per key)
- **Why multiple keys**: Distributes load, prevents rate limiting

### **3. ElevenLabs (OPTIONAL) ⚠️**
```
ELEVENLABS_API_KEY=sk_...
```
- **Where to get**: https://elevenlabs.io/app/settings/api-keys
- **Purpose**: Text-to-speech audio generation
- **Cost**: Paid service
- **What happens if missing**: Audio tab shows "not available" message

### **4. Brave Search (OPTIONAL) ⚠️**
```
BRAVE_SEARCH_API_KEY=...
```
- **Where to get**: https://brave.com/search/api/
- **Purpose**: Finds external resources/tutorials
- **Free tier**: Yes (limited)
- **What happens if missing**: Resources section shows fewer links

### **5. Groq API (OPTIONAL) ⚠️**
```
GROQ_API_KEY=...
GROQ_API_KEY_TECHNICAL=...
GROQ_API_KEY_APTITUDE=...
GROQ_API_KEY_HR=...
```
- **Where to get**: https://console.groq.com/keys
- **Purpose**: Interview question generation (separate from courses)
- **Free tier**: Yes

---

## **📊 Setup Scenarios**

### **Scenario 1: Minimum Setup (Just Works)**
```env
SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
GEMINI_API_KEY=xxx
```
**Result**: ✅ Course generation works, but may hit rate limits with many chapters

---

### **Scenario 2: Recommended Setup (Best Performance)**
```env
SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
GEMINI_API_KEY_1=xxx
GEMINI_API_KEY_2=xxx
GEMINI_API_KEY_3=xxx
ELEVENLABS_API_KEY=xxx
BRAVE_SEARCH_API_KEY=xxx
```
**Result**: ✅ Reliable generation, all features work, no rate limits

---

### **Scenario 3: Production Setup (Maximum Reliability)**
```env
# Use all 3 Gemini keys
GEMINI_API_KEY_1=xxx
GEMINI_API_KEY_2=xxx
GEMINI_API_KEY_3=xxx

# All optional features
ELEVENLABS_API_KEY=xxx
BRAVE_SEARCH_API_KEY=xxx
GROQ_API_KEY=xxx
```
**Result**: ✅ Enterprise-grade reliability, all features enabled

---

## **🎯 Key Count Summary**

| Feature | Required Keys | Optional Keys |
|---------|--------------|---------------|
| **Course Generation** | 1 Gemini | 2-3 more Gemini (load balancing) |
| **Audio (TTS)** | 0 | 1 ElevenLabs |
| **Resources** | 0 | 1 Brave |
| **Interviews** | 0 | 1-4 Groq |

**Total Minimum**: 2 keys (1 Supabase + 1 Gemini)  
**Total Recommended**: 5-7 keys (1 Supabase + 2-3 Gemini + 1 ElevenLabs + 1 Brave)

---

## **✅ Verification**

After setting up `.env`, verify it works:

```bash
cd backend
python verify-setup.py
```

Expected output:
```
✅ Found .env file
✅ SUPABASE_URL: Set
✅ SUPABASE_SERVICE_ROLE_KEY: Set
✅ GEMINI_API_KEY: Set (or GEMINI_API_KEY_1)
✅ All required environment variables are set
```

---

## **🔗 Where to Get Keys**

1. **Gemini**: https://makersuite.google.com/app/apikey (Free)
2. **Supabase**: Dashboard → Settings → API → Service Role Key
3. **ElevenLabs**: https://elevenlabs.io/app/settings/api-keys (Paid)
4. **Brave**: https://brave.com/search/api/ (Free tier available)
5. **Groq**: https://console.groq.com/keys (Free)

---

## **💡 Pro Tips**

1. **Multiple Gemini keys**: Create 2-3 free accounts, get 2-3 keys = 3x rate limit
2. **Keep keys secret**: Never commit `.env` to git (it's in `.gitignore`)
3. **Test keys**: Use `verify-setup.py` to check if keys work
4. **Rotate keys**: If one hits rate limit, add more to the list

