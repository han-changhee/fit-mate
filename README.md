# fit-mate (FitMate)

토스 인앱 웹뷰용 AI 개인화 운동 관리 미니앱 "핏메이트" 프로젝트.

- 배포: https://fit-mate-cyan.vercel.app
- 마스터 플랜(기획/BM/기술/배포): [docs/MASTER_PLAN.md](./docs/MASTER_PLAN.md)
- 서비스 이용약관(초안, 법률 검토 필요): [docs/TERMS_OF_SERVICE.md](./docs/TERMS_OF_SERVICE.md)
- Claude Code로 이어서 작업할 때 자동으로 읽히는 프로젝트 컨텍스트: [CLAUDE.md](./CLAUDE.md)

## 시작하기

```bash
git clone https://github.com/han-changhee/fit-mate.git
cd fit-mate
npm install
```

### 환경변수

레포에는 포함되지 않으므로 `.env.local` 파일을 새로 만들고 아래 값을 채워주세요.

```
GEMINI_API_KEY=
```

- 키 발급(무료): https://aistudio.google.com → "Get API key"
- 키가 없어도 앱은 정상 동작합니다 — 이 경우 AI 대신 더미 루틴(플랭크/스쿼트 고정)을 보여줍니다.

### 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 타입 체크 / 빌드

```bash
npm run typecheck
npm run build
```

## 배포 (Vercel)

이 프로젝트는 이미 Vercel 프로젝트(`chhan/fit-mate`)에 연결된 이력이 있습니다. 다른 PC에서는 아래처럼 다시 연결해야 합니다.

```bash
npx vercel login       # 브라우저에서 로그인
npx vercel link        # 이 폴더를 chhan/fit-mate 프로젝트에 연결
npx vercel env add GEMINI_API_KEY production   # Vercel에도 키 등록
npx vercel deploy --prod
```

GitHub 저장소를 Vercel에 Git 연동(푸시할 때마다 자동 배포)하려면 Vercel 대시보드 → `fit-mate` 프로젝트 → Settings → Git → Connect Git Repository에서 직접 승인해야 합니다(권한 승인 화면이라 CLI/코드로는 대신할 수 없습니다).

## 진행 상황

자세한 내용과 다음 할 일은 [CLAUDE.md](./CLAUDE.md)의 "현재 진행 상황"을 참고하세요. 요약:

- ✅ 화면 8개 스켈레톤 완성, Vercel 배포 완료
- ✅ Gemini API 연동 완료(로컬/프로덕션 모두 실제 AI 루틴 생성 확인됨)
- ✅ 서비스 이용약관 초안 작성(법률 검토 전)
- ⬜ 토스 로그인 연동, 개인정보처리방침 작성
- ⬜ 토스 파트너 콘솔 등록, 광고 슬롯/알림 템플릿 코드 발급
