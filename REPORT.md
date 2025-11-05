# Capstone Project Report: Vision Shopper (Furniture Fusion Bazaar)

| S.No. | Description                                    | Page No. |
|-------|------------------------------------------------|----------|
| 1.    | Abstract                                       | 1        |
| 2.    | Introduction                                  | 2        |
| 3.    | Literature Review                             | 4        |
| 4.    | Problem Identification & Objectives           | 7        |
| 5.    | Existing System                               | 10       |
| 6.    | Proposed System                               | 12       |
| 7.    | System Architecture                           | 15       |
| 8.    | Tools/Technologies Used                       | 18       |
| 9.    | Conclusion                                    | 21       |
| 10.   | References                                    | 22       |

---

## 1. Abstract

Vision Shopper, also known as Furniture Fusion Bazaar, is an AI-powered career development platform built to empower students and professionals in their job pursuit journey. Through intelligent resume analysis, skill gap identification, personalized course generation, DSA practice, and AI-driven interview coaching, we have engineered a holistic ecosystem that leverages leading-edge technologies such as Groq AI and Google Gemini. The system features a robust microservices architecture for scalability and rapid feature deployment, and uses modern web practices for security, responsiveness, and user experience.

---

## 2. Introduction

The gap between education and professional employment intensifies modern job-seeking challenges. Job aspirants struggle with fragmented learning resources, vague career pathways, insufficient resume feedback, and inadequate interview preparation. Vision Shopper tackles these pain points by merging AI and web technologies into a single unified platform: providing actionable career insights and automating end-to-end preparation processes. The platform is intended for students, recent graduates, and working professionals aiming to upgrade their career profiles.

---

## 3. Literature Review

Recent academic and industrial literature suggests the necessity for AI-driven systems in career development:

- **Resume Analysis**: Many platforms provide resume templates and manual reviews, but only a few offer instant, actionable feedback using AI ([Groq API Docs](https://groq.com/docs)).
- **Automated Skill Assessment**: Prior works largely focus on self-declared skills; Vision Shopper distinguishes itself by extracting, comparing, and matching skills to job descriptions using LLMs.
- **Personalized Learning**: Literature notes inefficiency in one-size-fits-all course flows. Our personalized course generator, powered by Google Gemini, creates dynamic learning paths based on actual gaps.
- **Microservices in EdTech**: Scalability and independent module development are keys to modern educational systems ([Microservices Patterns](https://microservices.io)). Vision Shopper’s modular design addresses these needs.
- **Current Gaps**: Competitors often have separate tools for resumes, courses, or DSA practice; integrating all features under a seamless user experience is what sets Vision Shopper apart.

---

## 4. Problem Identification & Objectives

### Problem Identification

Job seekers face challenges that include:

- Absence of automated, real-time resume quality and relevance checks.
- Lack of concrete skill-gap identification mechanisms.
- Fragmented, non-personalized learning avenues.
- Limited access to realistic mock interviews.
- Scattered profile and document management.

### Objectives

- Develop a scalable, AI-based resume analysis system (accuracy >90%).
- Enable microservice-based independent scaling and feature additions.
- Provide secure authentication and encrypted data storage.
- Integrate Groq and Gemini APIs for AI-driven operations.
- Deliver a responsive, user-friendly design.
- Maintain extensible documentation and future-proof database schema.

---

## 5. Existing System

Traditional platforms often:

- Offer only manual or superficial resume reviews.
- Let candidates self-assess rather than analyze skill gaps based on job roles.
- Use static courses, lacking dynamic or role-based personalized content.
- Miss dedicated, tracked practice for key technical skills like DSA.
- Use monolithic or tightly-coupled architectures, complicating future integrations.
- Provide scattered, basic authentication and require multiple logins for various services.

---

## 6. Proposed System

Vision Shopper innovates by combining and enhancing all aspects of the career preparation workflow:

- **AI Resume Analyzer**: Upload a resume in PDF/DOCX for Groq-based AI analysis, matching against target jobs and offering detailed, actionable feedback.
- **Profile Builder**: Centralized, persistent user profile with document upload, AI extraction, and editable fields.
- **Personalized Course Generation**: Gemini-powered module that fills skill gaps with a custom curriculum, including learning paths, topics, time estimates, and external resources.
- **AI Interview Coach**: Realistic mock interviews, feedback scoring, history, and analytics—all tailored by job roles and company types.
- **DSA Practice Module**: Curated and filterable sets of data structure and algorithm problems, persisted in MongoDB and connected with real-time analysis.
- **Microservices-based**: Each function runs as an independent service for easier scaling and updating, managed through an API gateway.
- **Unified Authentication**: JWT-based, single sign-on powering secure, role-aware access across the whole system.

---

## 7. System Architecture

**Diagrammatic Overview**

```text
┌────────────────────────┐
│ Frontend (React + Vite)│
└──────────┬─────────────┘
           │ REST APIs
┌──────────▼─────────────┐
│     API Gateway        │
│   (FastAPI, JWT)       │
└────────┬─┬─┬─┬─┬──────┘
         │ │ │ │ │
 ┌───────▼─▼─▼─▼─▼───────┐
 │ Resume │ Profile │ ... │
 │Analyzr │Servce  │ etc. │
 └─────▲──┴─┴─┴─┴───────┘
       │
 ┌─────▼──────────────┐
 │ Supabase (PGSQL)   │
 │ MongoDB (DSA)      │
 └────────────────────┘
```

- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **API Gateway**: FastAPI Python server for JWT authentication, request routing
- **Microservices**: Resume Analyzer, Profile Service, Course Generator, Interview Coach, DSA backends
- **DB/Storage**: Supabase PostgreSQL for transactional data, MongoDB for DSA
- **AI Services**: Groq (resume AI), Google Gemini (course AI)

---

## 8. Tools/Technologies Used

- **Frontend**: React (18.3.1), TypeScript (5.5.3), Vite (5.4.2), TailwindCSS, React Router DOM, Radix UI, ShadCN UI, Recharts, Framer Motion, Lucide React
- **Backend**: Python (3.8+), FastAPI (0.115.0), Uvicorn, asyncpg, PyJWT, PyPDF2, python-docx, Groq (0.32.0), google-generativeai, pymongo
- **Databases**: Supabase PostgreSQL, MongoDB (DSA problems)
- **CI/CD & Dev Tools**: Git, npm, pip, ESLint, Prettier, VS Code
- **AI/ML**: Groq API (resume), Google Gemini API (courses), prompt engineering

---

## 9. Conclusion

We have engineered Vision Shopper to redefine career preparation. By merging instant AI feedback, robust authentication, dynamic learning pathways, and practice tools into one ecosystem, our platform addresses the current gaps in job preparation and skills acquisition. Our modular, technology-driven approach ensures readiness for future enhancements and rapid adaptation to emerging career-support needs in academia and professional upskilling. This project not only provided deep technical learning but also demonstrated how thoughtful design and AI integration can create significant real-world impact.

---

## 10. References

1. [React Documentation](https://react.dev)
2. [FastAPI Documentation](https://fastapi.tiangolo.com)
3. [Supabase Documentation](https://supabase.com/docs)
4. [MongoDB Documentation](https://www.mongodb.com/docs)
5. [TailwindCSS Documentation](https://tailwindcss.com/docs)
6. [Groq API Documentation](https://groq.com/docs)
7. [Google Gemini API](https://ai.google.dev/docs)
8. [Prompt Engineering Guide](https://www.promptingguide.ai)
9. [JWT Authentication](https://jwt.io)
10. [RESTful API Design](https://restfulapi.net)
11. [Microservices Patterns](https://microservices.io)
12. [asyncpg](https://github.com/MagicStack/asyncpg)
13. [ShadCN UI](https://ui.shadcn.com)
14. [Radix UI](https://www.radix-ui.com)

---

*This document was collaboratively authored by our capstone team, based on our full-stack development and deployment of Vision Shopper (Furniture Fusion Bazaar). For academic and demonstration use only.*
