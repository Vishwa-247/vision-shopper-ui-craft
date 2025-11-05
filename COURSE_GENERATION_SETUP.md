# 🎓 Course Generation Setup Guide

## Quick Start (5 minutes)

### Step 1: Verify Environment Setup

1. **Check if `.env` file exists in `backend/` directory:**
   ```bash
   cd backend
   dir .env
   ```

2. **If `.env` doesn't exist, create it with these required variables:**
   ```env
   # Required for Course Generation
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Optional (for enhanced features)
   ELEVENLABS_API_KEY=your_elevenlabs_key_here
   BRAVE_SEARCH_API_KEY=your_brave_key_here
   GROQ_API_KEY=your_groq_key_here
   ```

3. **Get your Gemini API Key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a free API key
   - Copy and paste into `backend/.env` as `GEMINI_API_KEY`

### Step 2: Start Backend Services

**Option A - Quick Start (All Services):**
```bash
cd backend
start.bat
```

This will start:
- ✅ API Gateway (port 8000)
- ✅ Course Generation Service (port 8008)
- ✅ All other services

**Option B - Manual Start (Only Course Services):**

**Terminal 1 - API Gateway:**
```bash
cd backend
venv\Scripts\activate
cd api-gateway
python main.py
```

**Terminal 2 - Course Generation:**
```bash
cd backend
venv\Scripts\activate
cd agents\course-generation
python main.py
```

### Step 3: Verify Services Are Running

Run the verification script:
```bash
cd backend
python verify-setup.py
```

**Expected output:**
```
✅ Found .env file
✅ GEMINI_API_KEY: Set
✅ SUPABASE_URL: Set
✅ API Gateway: Running
✅ Course Generation: Running
🎉 Ready to test course generation!
```

### Step 4: Test Course Generation

1. **Start Frontend:**
   ```bash
   npm run dev
   ```

2. **Navigate to Course Generator:**
   - Go to: http://localhost:5173/course-generator

3. **Create a Course:**
   - Enter topic: "Machine Learning Basics"
   - Click "Create Course"
   - Watch progress bars animate
   - After ~40 seconds → Redirects to course page

## 🔧 Troubleshooting

### Issue: "Failed to fetch" error

**Solution:** Backend services are not running
1. Check if services are running:
   ```bash
   python backend\verify-setup.py
   ```
2. Start services:
   ```bash
   cd backend
   start.bat
   ```

### Issue: "Gemini API key not configured"

**Solution:** Add GEMINI_API_KEY to backend/.env
1. Get API key: https://makersuite.google.com/app/apikey
2. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

### Issue: Port 8000 already in use

**Solution:** Kill the process using port 8000
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F

# Then restart services
cd backend
start.bat
```

### Issue: Services start but don't respond

**Solution:** Check service logs
1. Look at the terminal windows where services are running
2. Check for error messages
3. Common issues:
   - Missing dependencies: `pip install -r requirements.txt`
   - Wrong Python version: Use Python 3.8+
   - Port conflicts: Change ports in service configs

## 📊 Expected Flow

```
User clicks "Create Course"
    ↓
Frontend → POST http://localhost:8000/courses/generate-parallel
    ↓
API Gateway (port 8000) → Forward to Course Generation (port 8008)
    ↓
Course Generation Service:
    - Creates course in Supabase
    - Starts background generation
    - Returns courseId immediately
    ↓
Background Tasks:
    - Generate audio (podcasts)
    - Generate articles (reading)
    - Generate quizzes/games (interacting)
    ↓
Real-time Updates:
    - Progress updates via Supabase
    - Frontend subscribes to updates
    - Progress bars animate
    ↓
Course Complete:
    - Redirects to /course/{courseId}
    - Shows all generated content
```

## ✅ Success Checklist

Before testing, verify:
- [ ] `backend/.env` file exists
- [ ] `GEMINI_API_KEY` is set in `.env`
- [ ] `SUPABASE_URL` is set in `.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- [ ] API Gateway is running on port 8000
- [ ] Course Generation is running on port 8008
- [ ] Frontend is running on port 5173
- [ ] Health checks pass: `python backend\verify-setup.py`

## 🎯 Quick Test Command

**Windows (PowerShell):**
```powershell
cd backend; python verify-setup.py; if ($?) { Write-Host "✅ Ready! Start services with: start.bat" }
```

**Windows (CMD):**
```cmd
cd backend && python verify-setup.py && echo ✅ Ready! Start services with: start.bat
```

## 📞 Need Help?

If you encounter errors:
1. Run: `python backend\verify-setup.py`
2. Check service terminal logs
3. Check browser console (F12)
4. Check Network tab for API calls

Share the error messages and I can help debug!

