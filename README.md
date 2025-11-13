# HYANG (v2)

🚀 This is the **v2 restructure** of the HYANG project.  
The project has been fully rebuilt with a new backend/frontend folder structure.

**Previous version:** `main` branch  
**Current version:** `v2/restructure`

---

## Folder Overview

HYANG/
├── backend/ # Express + MySQL API server
├── frontend/ # HTML/JS/CSS client
├── db/ # schema.sql
└── .gitignore

## Local Development

루트에서 한 번만 backend 의존성을 설치하세요:

```bash
npm run install:backend
```

그 후에는 프로젝트 루트에서 바로 `npm start`(프로덕션 모드)나 `npm run dev`(nodemon)로 프런트와 백엔드를 동시에 실행할 수 있습니다. Express 서버가 `frontend/` 정적 자산을 서빙하므로 별도의 프런트 개발 서버는 필요하지 않습니다.
