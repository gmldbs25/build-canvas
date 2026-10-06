# KotoMachi를 만들며

KotoMachi는 가을 삿포로를 걷고 일본어를 쓰는 작은 RPG로 시작했다. 실행 환경과 학습 구조, 화면을 고쳐 가며 첫 시제품은 Chapter 1 전체로 확장됐다. 이 글은 저장소의 문서와 커밋을 통해 그 변화를 따라간다.

## 한 장면에서 시작한 프로젝트 {#beginning}

2026년 9월 23일의 첫 기획 문서에는 가을 삿포로, 반복해서 만나는 사람들, 이야기 속 일본어 학습이 함께 등장한다. 게임 콘셉트와 학습 설계, Chapter 1의 이야기와 지도를 계획한 뒤, 역 앞에서 안내 직원과 대화하고 저장·이어하기를 확인하는 작은 시제품을 만들었다.

첫 구현은 React Native 기반으로 Apps in Toss를 대상으로 했다. 한 장면에서 일본어 대화와 단어 도움, 음성 재생을 시험했지만, 실제 Toss iOS·Android 호환성은 아직 확인하지 못한 상태였다.

기기 TTS로 일본어를 읽는 방법도 검토했다. 다만 Toss에서 사용할 경로가 확인되지 않아, 첫 시제품에는 미리 생성한 음성 파일을 넣었다. 음성 구현은 이후 플랫폼 전환과 함께 다시 바뀐다.

:::human-note
**Human Note · 직접 작성할 자리**  
이 프로젝트를 처음 시작한 계기와, 첫 조각에서 꼭 확인하고 싶었던 것을 heeyoon이 직접 적습니다. 저장소에는 개인적인 시작 이유가 기록되어 있지 않습니다.
:::

> 기록: [첫 시제품 · 79a625c](https://github.com/gmldbs25/kotomachi/commit/79a625c) · [초기 콘셉트 · c5e854a](https://github.com/gmldbs25/kotomachi/commit/c5e854a)

## 실행 환경을 다시 고르다 {#platform}

첫 시제품 이후에는 실행 환경부터 바꿨다. 9월 25일 인프라 문서가 PWA 우선 방향으로 바뀌었고, 설치 가능한 웹 앱이 구현됐다. 이후 KotoMachi는 React, TypeScript, Vite 기반의 브라우저 게임으로 개발됐으며, 현재 Vercel에 배포되어 있다.

인프라 문서는 빠른 배포와 재사용을 이유로 든다. 네이티브 전용 기능이 필요하지 않은 단계에서, 웹은 HTTPS로 바로 배포하고 iPhone 홈 화면에 설치해 시험할 수 있었다. 나중에 Apps in Toss WebView에서도 같은 빌드를 재사용할 수 있다. 우선 브라우저에서 게임을 만들고 확인한 뒤, 배포 채널을 넓히는 선택이었다.

저장도 서버 없이 기기 안에서 처리하는 local-first로 시작했다. 계정과 클라우드 동기화를 운영하지 않고, 진행 데이터를 브라우저의 IndexedDB에 보관한다. 대신 기기 간 저장 이동은 보장되지 않고, 브라우저 데이터를 지우면 진행을 잃을 수 있다.

챕터가 커져도 기존 플레이를 이어 갈 수 있도록, 저장 형식이 바뀔 때 데이터를 변환하고 복구 사본을 남겼다. 앱 파일은 Workbox로 캐시하고 업데이트 전에는 진행을 저장한다. 저장 공간이 웹 주소의 출처(origin)에 묶이므로 배포 주소도 유지한다. 첫 버전의 운영 범위를 줄이면서, 반복 배포가 플레이 기록을 끊지 않게 한 구조다.

:::figure
![가을빛 삿포로 상점가를 걷는 주인공](assets/kotomachi-shopping.webp)
*다시 만든 다누키코지 상점가. 작은 모바일 화면에서도 읽히는지 확인한 대표 장면이다.*
:::

> 기록: [PWA 전환 · d48a6a4](https://github.com/gmldbs25/kotomachi/commit/d48a6a4) · [설치형 PWA 구현 · 2e61b9f](https://github.com/gmldbs25/kotomachi/commit/2e61b9f) · [인프라 문서](https://github.com/gmldbs25/kotomachi/blob/main/docs/INFRASTRUCTURE.md)

## 단어 도움에서 학습의 흐름으로 {#learning}

Chapter 1을 만들면서 대화 도움말에 연습, 대화 기록, 노트가 더해졌다. 이어 각 장면이 표현을 소개하는지, 연습시키는지, 다시 쓰게 하는지를 콘텐츠에 표시했다. 이 작성 규칙을 동네 일상에서 오타루와 가을 축제까지 적용하면서, 표현을 여러 장면에 걸쳐 다룰 수 있게 됐다.

다음 과제는 배운 표현을 직접 쓰게 하는 것이었다. 문맥에 맞는 응답과 빈칸 채우기, 문장 조합, 게임 속 행동으로 이어지는 연습을 넣었다. 하루 끝에는 그날의 표현을 되짚는 ‘오늘의 코토바’를 추가했다. 이후에는 처음 만난 표현에 충분한 도움을 주고, 다시 등장할수록 도움을 줄여 기억에서 꺼내 쓰도록 구조를 다듬었다.

설계의 중심은 이해한 표현을 사용하고, 기억에서 꺼내 다른 상황에 다시 쓰는 흐름이다. 이 구조는 구현됐으며, 실제 학습 경험은 개발자의 플레이테스트로 확인할 단계에 있다.

:::figure
![처음 등장한 표현을 대화 장면에서 확인하는 화면](assets/first-encounter.webp)
*새 표현을 처음 만나는 대화 장면. 상황과 도움을 함께 제공한다.*
:::

:::human-note
**Human Note · 직접 작성할 자리**  
처음의 학습 아이디어에서 무엇이 부족하다고 느꼈는지, 실제 플레이에서 어떤 순간을 고치고 싶었는지 heeyoon이 직접 덧붙입니다. 저장소 기록만으로 당시의 감정이나 판단을 대신 쓰지 않습니다.
:::

> 기록: [대사 학습·노트 · d654117](https://github.com/gmldbs25/kotomachi/commit/d654117) · [학습 콘텐츠 작성 체계 · c7effa1](https://github.com/gmldbs25/kotomachi/commit/c7effa1) · [학습 경험 개선 · a2e8c7e](https://github.com/gmldbs25/kotomachi/commit/a2e8c7e) · [첫 만남과 기억 회상 보완 · 2a198c3](https://github.com/gmldbs25/kotomachi/commit/2a198c3)

## 화면의 기준을 다시 세우다 {#visuals}

초기 아트 방향은 픽셀 그래픽이었다. 지도 크기와 이동 거리, 충돌과 화면 구도를 정리한 뒤, 상점가와 히로시의 가게를 대표 장면으로 만들었다. 하지만 이 화면은 기대한 디자인 수준에 미치지 못했다. 로드맵에는 고해상도 이미지로 교체해도 기존의 거친 픽셀 렌더링 방식을 유지한 탓에 원하는 인상이 나오지 않았다고 기록되어 있다.

다시 잡은 방향은 부드러운 일러스트풍의 2D 치비 RPG였다. 같은 상점가와 가게의 아트를 다시 만들고, 픽셀을 그대로 확대하던 렌더링도 고해상도 화면에 맞게 바꿨다. 이 대표 장면이 검토를 통과한 뒤에 Chapter 1의 지도 전반으로 확장했다.

확장 과정에서는 터치 입력과 이미지가 겹치는 순서도 손봤다. 기념품을 얻은 상태와 집에 놓은 상태를 구분하도록 저장도 수정했다. 화면 개선은 자산 교체에서 끝나지 않았고, 이동·상호작용·저장을 함께 조정하는 작업으로 이어졌다.

> 기록: [시각 방향 재설정 · 176926c](https://github.com/gmldbs25/kotomachi/commit/176926c) · [대표 장면 재구현 · fb9033f](https://github.com/gmldbs25/kotomachi/commit/fb9033f) · [챕터 전체로 확장 · 84d9505](https://github.com/gmldbs25/kotomachi/commit/84d9505) · [터치 입력 보완 · 4f69c19](https://github.com/gmldbs25/kotomachi/commit/4f69c19)

## 만들었다고 끝나지 않는 것들 {#iteration}

대표 장면이 검토를 통과했다고 챕터 전체의 화면까지 검증된 것은 아니었다. 확장 뒤에는 대사의 화자 표시와 기념품 상태를 다시 수정했다. 학습 구조도 구현 이후 플레이테스트를 남겨 두었다. 문서에서 ‘구현 완료’와 ‘개발자의 검토 완료’를 구분하는 이유다.

Playwright 테스트와 여러 화면 크기의 캡처로 동작을 반복 점검했다. 실제 iPhone에서 확인할 PWA 검증 절차도 마련했다. 자동화로 확인할 수 있는 것은 화면과 저장 등의 동작이다. 터치감과 음성 품질, 학습의 흐름은 직접 플레이하며 확인해야 한다.

현재 기록에서도 챕터 전체의 시각 검토와 학습 플레이테스트는 대기 상태다. 실제 플레이에서 발견한 불편과 개선 경험은 아래 Human Note에 남길 수 있다.

:::figure
![오늘의 코토바에서 문장 덩어리를 조합하는 화면](assets/today-kotoba.webp)
*오늘의 코토바 문장 만들기 라운드. 캡처로 확인한 동작과 직접 플레이한 평가는 구분해 기록한다.*
:::

:::human-note
**Human Note · 직접 작성할 자리**  
직접 플레이하며 발견한 불편, 기대와 달랐던 점, 반복해서 고친 장면을 구체적인 사례로 적습니다. 어떤 테스트를 직접 수행했는지도 구분해 주세요.
:::

> 기록: [저장·대화 표현 조정 · cc4da8a](https://github.com/gmldbs25/kotomachi/commit/cc4da8a) · [현재 상태](https://github.com/gmldbs25/kotomachi/blob/main/docs/CURRENT_STATUS.md) · [PWA 검증 절차](https://github.com/gmldbs25/kotomachi/blob/main/docs/PWA_VALIDATION.md)

## Agent와 일하는 방식도 바뀌었다 {#agents}

Agent 운영 규칙도 개발 중에 바뀌었다. 9월 27일의 첫 가이드는 큰 구현을 Astra가 맡고, Sol이 독립 검토를 하며, Luna가 Git 등 가벼운 작업을 처리하도록 나눴다. 강한 모델의 구현과 별도 검토를 중심에 둔 구성이었다.

9월 29일에는 범위가 명확한 일을 Luna가 우선 맡도록 바꿨다. 모든 작업에 별도 검토를 붙이기보다, 막히거나 불확실할 때 Sol이나 Astra로 넘기는 규칙이었다. 다음 날에는 Sol이 목표 파악과 작업 분해, 통합·최종 판단을 총괄하도록 했다. Luna는 대부분의 조사와 구현을 수행하고, Astra는 Sol의 분석으로도 풀리지 않는 구조적 문제나 고위험 판단에만 호출하도록 했다.

이 역할 분담은 `.codex/config.toml`에도 반영됐다. 작업의 범위와 난도에 맞춰 모델을 쓰고, 전체 작업량을 줄이려는 변화다. 다만 이 기록은 운영 규칙의 변화이지, 과거 모든 커밋을 어떤 Agent가 만들었는지에 대한 증거는 아니다.

:::human-note
**Human Note · 직접 작성할 자리**  
Agent에게 맡긴 일과 직접 판단한 일을 어떻게 나눴는지, 협업 방식이 바뀌며 느낀 점을 heeyoon이 적습니다.
:::

> 기록: [초기 역할 분담 · a0bac26](https://github.com/gmldbs25/kotomachi/commit/a0bac26) · [Luna-first 전환 · 1597802](https://github.com/gmldbs25/kotomachi/commit/1597802) · [Sol orchestration · f22d151](https://github.com/gmldbs25/kotomachi/commit/f22d151) · [설정 반영 · 4c5e5f4](https://github.com/gmldbs25/kotomachi/commit/4c5e5f4)

## 아직 남겨 둔 결정 {#open-work}

음성은 미리 생성한 파일에서 기기의 일본어 음성을 사용하는 Web Speech로 바뀌었다. 캐릭터별 재생 설정은 있지만, 기기마다 음색과 품질은 다르다. 챕터 전체의 대사 음성 제작은 아직 시작하지 않았다. 로드맵에서는 학습 내용이 검토되고 안정된 뒤에 음성을 제작하도록 순서를 정했다.

현재 KotoMachi는 한 챕터를 끝까지 플레이할 수 있는 상태다. 다음 단계는 시각·학습 검토를 마치고 필요한 부분을 보완하는 일이다. 음성 제작은 그 이후로 남겨 두었다.

:::human-note
**Human Note · 직접 작성할 자리**  
지금 남은 과제 중 무엇을 먼저 다루고 싶은지, 음성이나 학습 검토에서 어떤 기준을 기대하는지 직접 작성합니다.
:::

> 기록: [오디오 제작 현황](https://github.com/gmldbs25/kotomachi/blob/main/docs/AUDIO_PRODUCTION.md) · [개발 로드맵](https://github.com/gmldbs25/kotomachi/blob/main/docs/DEVELOPMENT_ROADMAP.md) · 조사 기준 커밋 `791170e`

## Developer Interview {#interview}

아래 질문은 KotoMachi를 만들며 겪은 기획과 개발, 그리고 AI Agent와의 협업 경험을 돌아보기 위해 정리했다. 답변은 heeyoon이 자신의 경험과 말투로 직접 채운다.

### 처음 KotoMachi를 만들려고 했을 때, 어떤 걸 만들어보고 싶었나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### 시작할 때 AI Agent가 어느 정도까지 해줄 거라고 기대했나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### 실제로 개발해보니 그 기대와 가장 달랐던 점은 무엇이었나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### 만들면서 가장 크게 방향을 바꾼 결정은 무엇이었나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### Agent에게 일을 맡길 때 가장 중요하다고 느낀 것은 무엇이었나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### 좋은 모델 하나를 쓰는 것과 역할을 나누고 하네스를 만드는 것 중, 무엇이 더 중요하다고 느꼈나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### Agent와 개발하면서 가장 답답했던 순간은 언제였나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### 반대로 “이건 생각보다 정말 잘한다”고 느낀 순간은 언제였나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### 직접 대부분의 코드를 작성하지 않았는데도, KotoMachi를 ‘내가 만든 프로젝트’라고 느끼나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

### 다음 프로젝트를 다시 Agent와 만든다면 처음부터 무엇을 다르게 하고 싶나요?

:::human-answer
[heeyoon이 직접 답변을 작성할 자리]
:::

## 실제 KotoMachi 보기 {#play}

개발 기록을 읽고 나면, 지금 만들어진 장면을 직접 걸어 볼 수 있다. [KotoMachi 열기](https://kotomachi-yoon.vercel.app) · 같은 챕터를 시작할 때는 플레이 기록이 이 브라우저에 저장된다.
