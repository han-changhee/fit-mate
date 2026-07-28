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
- [x] 로그인/회원가입/회원탈퇴 구현 완료 — `appLogin()`으로 토스 로그인, 첫 로그인이 곧 회원가입(별도 가입 절차 없음, `LoginScreen`에 약관 동의 체크박스 포함), 설정 화면에서 회원탈퇴 시 로컬에 저장된 모든 데이터(AUTH_SESSION/USER_PROFILE/STREAK_STATE/REMINDER_TIME) 삭제 후 로그인 화면으로 복귀. 브라우저에서 로그인 실패 처리·탈퇴 흐름 모두 클릭 테스트 완료.
  - **아직 실제 사용자 신원 확인은 안 됨**: `appLogin()`은 `authorizationCode`만 받아오고, 이를 실제 토스 사용자 정보로 교환하려면 토스 파트너 콘솔에서 앱을 등록해 `TOSS_CLIENT_ID`/`TOSS_CLIENT_SECRET`을 발급받아야 한다. `src/lib/authHandler.ts`의 `handleTossAuthRequest`가 그 자리를 잡아뒀고(`api/auth/toss.ts`), 지금은 두 값이 없으면 `verified: false`로 통과만 시킨다(Gemini 키 없을 때 더미 루틴 반환하는 것과 동일한 패턴). 결제 등 신원 확인이 꼭 필요한 기능에는 이 상태의 세션을 신뢰하면 안 된다.
- [ ] 광고 SDK(TossAds) 실제 슬롯 미연동 — `adGroupId` prop이 비어있으면 컴포넌트가 자동으로 숨겨지는 상태
- [ ] 토스 파트너 콘솔 앱 등록, 광고 슬롯/알림 템플릿 코드/`TOSS_CLIENT_ID`·`TOSS_CLIENT_SECRET` 발급
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
