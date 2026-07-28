# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"핏메이트" (FitMate) — 토스 인앱(Apps in Toss) 미니앱으로 동작하는 AI 개인화 운동 루틴 추천 웹앱. `@apps-in-toss/web-framework` 기반 React 앱이며 Vercel에 배포되어 있다. 전체 기획/BM/아키텍처/배포 전략은 [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)에 정리되어 있다 — 새 기능을 논의하기 전에 먼저 참고할 것.

## 현재 진행 상황 (2026-07-28 기준)

- [x] 프로젝트 스켈레톤 완성 — 온보딩/홈/루틴생성대기/루틴미리보기/운동세션/완료/기록/설정 8개 화면 모두 구현, 브라우저에서 전체 플로우 클릭 테스트 완료
- [x] Vercel 프로젝트 연결 및 배포 완료 — https://fit-mate-cyan.vercel.app (production)
- [ ] GitHub ↔ Vercel 자동 배포 연결 실패한 상태 — Vercel 대시보드에서 수동 승인 필요 (프로젝트 Settings → Git → Connect Git Repository). 그 전까지는 `npx vercel deploy --prod`로 수동 배포.
- [x] `api/routine.ts`에 Gemini API(`gemini-flash-lite-latest`, 무료 티어) 연동 코드 완성
- [x] `GEMINI_API_KEY` 로컬(`.env.local`)/Vercel(production) 둘 다 정상 등록, 실제 AI 루틴 생성 로컬·프로덕션 양쪽 확인 완료(`routineId`가 `ai_...`로 시작)
  - 삽질 기록 1(모델 선택): 처음엔 `gemini-2.5-flash-lite`(404, 신규 프로젝트에 미제공) → `gemini-2.0-flash-lite`(이 프로젝트엔 할당량 0)로 바꿔도 계속 실패했다. `https://ai.dev/rate-limit` 대시보드로 확인해보니 실제로는 계정에 쿼터가 있었고, 문제는 모델 ID를 잘못 골랐던 것이었다. 지금은 `gemini-flash-lite-latest`(그 시점의 최신 flash-lite 모델로 자동 라우팅되는 별칭)로 고정 — 특정 스냅샷 ID 대신 `-latest` 별칭을 쓰는 게 이런 deprecation/quota 삽질을 피하는 방법이다. 모델을 바꾸고 싶으면 `GEMINI_MODEL` 환경변수로 오버라이드.
  - 삽질 기록 2(env var 등록): `vercel env add GEMINI_API_KEY production`을 대화형 프롬프트(`Value?`)로 입력했을 때 값이 13자로 잘려서 등록된 적이 두 번 있었다(터미널 마스킹 입력 붙여넣기 버그로 추정). `echo -n "<키>" | vercel env add GEMINI_API_KEY production`처럼 stdin으로 파이프하는 방식이 더 안전하다. 이 프로젝트에서 env var 관련 이상 동작이 있으면 `vercel env pull <file> --environment=production`으로 실제 등록된 값의 길이부터 확인할 것.
- [x] 로그인/회원가입/회원탈퇴 **코드는 구현했지만 현재 비활성화(주석 처리)** — 서버 DB가 없어서 `appLogin()`이 인가 코드만 받아올 뿐 저장/검증하는 게 없어 실질적 기능이 없다고 판단, `src/App.tsx`와 `src/screens/SettingsScreen.tsx`에서 관련 코드를 주석 처리해 로그인 없이 바로 온보딩/홈으로 진입하도록 되돌렸다(`dawn-peach`와 동일한 무로그인 방식). 파일 자체(`LoginScreen.tsx`, `useAuth.ts`, `authApi.ts`, `authHandler.ts`, `api/auth/toss.ts`, `rsbuild.config.ts`의 `/api/auth/toss` 미들웨어)는 그대로 남아있다.
  - **재활성화 방법**: `src/App.tsx`에서 `useAuth`/`LoginScreen` import와 `session` 관련 3개 블록(로딩/게이트/handleWithdraw) 주석을 풀고, `useUserProfile()`/`useStreak()` 구조분해에 `clearProfile`/`resetStreak`를 다시 추가하고, `SettingsScreen` 호출부를 `onWithdraw={handleWithdraw}`로 바꾸면 된다. `SettingsScreen.tsx`에서도 `onWithdraw` prop과 탈퇴 UI 블록 주석을 풀어야 한다.
  - **재활성화가 의미 있어지는 시점**: DB를 붙여서 (1) `authorizationCode`를 토스 OAuth 토큰 교환 API로 실제 신원 확인(`TOSS_CLIENT_ID`/`TOSS_CLIENT_SECRET` 필요), (2) 여러 기기 간 데이터 동기화, (3) 구독 결제를 특정 사용자에 귀속 등을 하고 싶을 때.
- [ ] 광고 SDK(TossAds) 실제 슬롯 미연동 — `adGroupId` prop이 비어있으면 컴포넌트가 자동으로 숨겨지는 상태
- [x] 토스 파트너 콘솔에서 알림(스마트 발송 > 기능성) 등록 완료 — 발송 코드 `fit-mate-reminder`, `PUBLIC_NOTIFICATION_TEMPLATE_CODE`로 로컬/프로덕션 반영됨
- [x] mTLS 인증서 발급 및 서버 연동 완료 — `api/notifications/send-test.ts`(Node.js 런타임, mTLS 필요해서 Edge 불가)에서 실제 토스 스마트 발송 API(`POST .../messenger/send-message`) 호출 확인됨(더미 `anonKey`로 "인증 정보를 찾을 수 없어요" 에러까지 받아서 mTLS 자체는 통과하는 것 확인)
  - API 스펙: https://developers-apps-in-toss.toss.im/documentation/common/growth/smart-message . 인증은 `x-anon-key`(또는 `x-user-key`) 헤더 + mTLS 클라이언트 인증서 둘 다 필요. `TOSS_MTLS_CERT`/`TOSS_MTLS_PRIVATE_KEY`는 base64로 인코딩해 env var에 저장(PEM 줄바꿈이 CLI 파이프 과정에서 깨지는 걸 피하려고).
  - **주의**: Node 런타임 함수는 `src/lib`의 다른 파일을 import하면 `ERR_MODULE_NOT_FOUND`로 죽는다(package.json이 `"type": "module"`이라 Node 네이티브 ESM 로더가 확장자 없는 상대경로를 못 찾음 — Edge Function은 esbuild 번들링이라 문제없었음). Node 런타임 함수는 로직을 파일 안에 인라인으로 넣을 것.
- [x] Upstash Redis 연결 완료(`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) — `api/reminders/save.ts`에서 `anonKey -> reminderTime` 저장 확인됨. Vercel Storage 탭의 마켓플레이스 연동(Upstash, Redis Cloud 둘 다)은 무료 티어가 없어서, console.upstash.com에서 직접 만든 무료 인스턴스를 수동으로 연결했다.
- [ ] **클라이언트에서 아직 이 저장 엔드포인트를 안 씀** — `SettingsScreen.tsx`는 여전히 리마인더 시간을 로컬(Storage/localStorage)에만 저장한다. `getAnonymousKey()`로 익명 키를 받아서 `/api/reminders/save`로 보내는 연동이 필요하다(로그인 없이 가능 — `getAnonymousKey()`는 로그인과 무관한 별도 SDK 함수).
- [ ] **실제 발송 스케줄러(cron) 없음** — Redis에 저장은 되지만, 저장된 시간이 됐을 때 `api/notifications/send-test.ts`의 발송 로직을 실제로 트리거해주는 주기적 작업이 아직 없다. Vercel Cron 설정 필요(무료 Hobby 플랜은 크론 주기가 하루 1회로 제한될 수 있음 — 사용자 확인 필요).
- [ ] IAP 구독 연동 — 무료 사용자 데이터 축적 이후로 보류 중

## Commands

- `npm install`
- `npm run dev` — rsbuild dev server, http://localhost:3000
- `npm run typecheck` — `tsc --noEmit`; 별도 lint/test 스크립트는 없음
- `npm run build` — `dist/`로 프로덕션 빌드
- `npx vercel deploy --prod` — 프로덕션 배포 (`chhan/fit-mate` 프로젝트에 이미 링크됨, 새 PC라면 `npx vercel link`로 재연결 먼저 필요할 수 있음)
- `npx vercel env add GEMINI_API_KEY production` — Gemini 키를 Vercel에 등록 (프롬프트가 뜨면 직접 붙여넣을 것 — 절대 코드나 커밋에 값 자체를 넣지 말 것)

## Architecture

- **화면 전환은 라우터 없이 `src/App.tsx`의 `useState<Screen>`으로 처리한다** (`toss-coin-jump`/`dawn-peach`와 동일한 워크스페이스 컨벤션). 진입 순서는 `useAuth()`의 `session`이 `null`이면 무조건 `LoginScreen`부터(로그인 게이트), 로그인 후 `useUserProfile()`이 `null`이면 `OnboardingScreen`으로 이어진다.
- **로그인은 `appLogin()`(`@apps-in-toss/web-framework`) → `authorizationCode`를 `/api/auth/toss`로 전송 → `useAuth().login()`으로 로컬 세션 저장** 순서다. 첫 로그인이 곧 회원가입이라 별도 가입 화면이 없다(`LoginScreen`에 약관 동의 체크박스만 있음). 회원탈퇴는 `SettingsScreen`에서 `AUTH_SESSION`/`USER_PROFILE`/`STREAK_STATE`/`REMINDER_TIME`을 전부 지우고 `useAuth().logout()`을 호출하는 방식(`App.tsx`의 `handleWithdraw`)으로 구현했다 — 새로운 로컬 저장 키를 추가할 때는 이 목록에도 추가해야 탈퇴 시 누락되지 않는다.
- **`src/lib/routineHandler.ts`가 루틴 생성의 유일한 진입점이다.** `api/routine.ts`(Vercel Edge Function, 프로덕션)와 `rsbuild.config.ts`의 `server.setup` dev 미들웨어(로컬 개발)가 이 함수를 그대로 공유한다.
  - **이 파일을 수정한 뒤 로컬에서 바로 확인하려면 dev 서버를 반드시 재시작해야 한다.** rsbuild dev 미들웨어는 클라이언트 번들만 HMR하고, `server.setup`에서 import한 서버 사이드 모듈은 재시작 전까지 이전 코드로 남아있는다. curl로 확인했는데 옛날 응답이 나오면 이 문제다.
- **`GEMINI_API_KEY`가 없거나 API 호출이 실패하면 항상 더미 루틴으로 폴백한다.** `generateRoutineWithAI` 호출을 try/catch로 감싸므로, 키 설정 전이나 Gemini 장애 시에도 화면 흐름이 끊기지 않는다.
- **`rsbuild.config.ts`는 `.env.local`을 `loadEnv({ cwd: dirname(fileURLToPath(import.meta.url)) })`로 직접 로드한다.** rsbuild가 자동으로 process.env를 채워주지 않기 때문이며, `cwd`를 `process.cwd()`로 하면 안 된다 — 이 워크스페이스에서는 `npm --prefix fit-mate run dev`처럼 상위 폴더에서 실행할 때 `process.cwd()`가 fit-mate가 아닌 상위 폴더를 가리켜서 `.env.local`을 못 찾는 문제가 실제로 있었다.
- **토스 SDK 호출은 전부 `safeIsSupported`(`src/lib/bridgeSupport.ts`) 또는 try/catch로 감싼다.** 인앱 웹뷰 밖(일반 브라우저 프리뷰)에서는 `.isSupported()` 자체가 예외를 던지기 때문 — false를 반환하지 않는다.
- **`Storage`(토스 브릿지)는 항상 `window.localStorage` 폴백과 세트로 쓴다.** `useUserProfile`, `useStreak`, `SettingsScreen`의 알림 시간 저장이 모두 이 패턴(`Storage.getItem(...).catch(() => window.localStorage.getItem(...))`).

## 배포

- Vercel 프로젝트: `chhan/fit-mate` (연결 정보는 `.vercel/project.json`에 있으나 그 폴더 자체는 `.gitignore`로 제외됨 — 새 PC에서는 `npx vercel link`로 다시 연결해야 함)
- 빌드 설정은 `vercel.json`에 명시되어 있다(rsbuild가 Vercel의 프레임워크 자동 감지 목록에 없어서 `buildCommand`/`outputDirectory`를 직접 지정함)
- Production: https://fit-mate-cyan.vercel.app

## 참고 문서

- [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) — 서비스 기획/UX, 광고·BM 전략, 기술 아키텍처, 배포 체크리스트 전체
