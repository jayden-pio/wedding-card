# 예식 후 비노출 전환 절차

> **전환일 `2026-12-12`** (예식 `2026-12-05` 1주 후)
> **순서: ① 가비아 DNS 삭제 → ② 10분 대기 → ③ GitHub Pages 끄기 → ④ 저장소 private 전환**
> 목표는 `msandyj.store` 접속 시 **아무것도 안 뜨게** 하는 것(브라우저 자체 DNS 오류 화면).

---

## 왜 이 순서여야 하나

**순서를 바꾸면 GitHub이 그대로 노출된다.** Pages를 먼저 끄면 DNS는 여전히 GitHub IP를 가리키고 있어서, GitHub 인프라가 자기 안내 페이지로 응답한다. 실제로 확인한 응답:

```
HTTP/1.1 404 Not Found
Server: GitHub.com
<title>Site not found · GitHub Pages</title>
```

본문에 "There isn't a GitHub Pages site here." + github.com 링크가 들어있고, **탭 제목부터 드러난다.** 저장소에 있는 커스텀 `404.html`로는 막을 수 없다 — 그 파일은 *배포가 살아있을 때 없는 경로로 들어온 경우*에만 쓰이고, 배포 자체가 없어지면 GitHub 기본 페이지가 나간다.

**DNS를 먼저 지우면** 도메인이 아예 해석되지 않아서 요청이 GitHub까지 가지 못한다. 그래서 DNS가 먼저다.

또 하나 — **저장소가 public이라 사이트를 내려도 계좌번호는 계속 공개된다.** `raw.githubusercontent.com`에서 인증 없이 `index.html`을 읽을 수 있고, 거기에 계좌번호가 그대로 들어있다. 과거 커밋 히스토리에도 남아있다. 이건 **private 전환으로만** 해결된다. (무료 플랜에서 Pages는 public 저장소에서만 동작하므로, 사이트를 운영하는 동안에는 public일 수밖에 없다.)

그리고 private으로 바꾸면 Pages가 자동으로 내려간다. 그래서 private 전환도 DNS 삭제 뒤여야 한다.

---

## 체크리스트

### ① 가비아에서 DNS 레코드 삭제

- [ ] [가비아](https://www.gabia.com) 로그인
- [ ] **My가비아 → DNS 관리툴 → `msandyj.store` → 레코드 수정**
- [ ] 아래 **5개 레코드를 모두 삭제** 후 저장

  | 타입 | 호스트 | 값 |
  |---|---|---|
  | A | `@` | `185.199.108.153` |
  | A | `@` | `185.199.109.153` |
  | A | `@` | `185.199.110.153` |
  | A | `@` | `185.199.111.153` |
  | CNAME | `www` | `jayden-pio.github.io.` |

  > `www` CNAME을 빼먹으면 `www.msandyj.store`로 들어왔을 때 `Site not found · GitHub Pages`가 그대로 뜬다. 반드시 같이 지울 것.

### ② 10분 대기

- [ ] 저장 후 **최소 10분** 기다린다 (레코드 TTL이 600초라서 캐시가 그때까지 남는다)

### ③ 삭제 확인

- [ ] 아래 두 명령이 **모두 빈 결과**여야 다음 단계로 진행

  ```bash
  dig +short A msandyj.store
  dig +short www.msandyj.store
  ```

  뭔가 나오면 아직 캐시가 안 빠진 것이니 몇 분 더 기다렸다 다시 확인한다.

### ④ GitHub Pages 끄기

- [ ] `jayden-pio` 계정으로 로그인
- [ ] **Settings → Pages → Build and deployment → Source를 `None`으로 변경**

### ⑤ 저장소 private 전환

- [ ] **Settings → 맨 아래 Danger Zone → Change repository visibility → Make private**
- [ ] 확인 입력창에 `jayden-pio/wedding-card` 입력 후 확정

### ⑥ 최종 확인

- [ ] 브라우저에서 `msandyj.store` 접속 → **브라우저 DNS 오류 화면**(“사이트에 연결할 수 없음” 류)이 뜨면 성공
- [ ] 아래 검증 명령으로 재확인

---

## 검증 명령

단계마다 복붙해서 확인.

```bash
# DNS가 완전히 사라졌는지 (둘 다 빈 결과여야 정상)
dig +short A msandyj.store
dig +short www.msandyj.store

# 도메인 접속 — "Could not resolve host" 가 나와야 정상
curl -sI https://msandyj.store/ 2>&1 | head -3

# 저장소 상태 — private: true, has_pages: false 여야 정상
gh api repos/jayden-pio/wedding-card --jq '{private, has_pages}'

# 파일이 더 이상 공개로 안 읽히는지 — 404 가 나와야 정상
curl -s -o /dev/null -w '%{http_code}\n' \
  https://raw.githubusercontent.com/jayden-pio/wedding-card/main/index.html
```

`gh` 명령은 `jayden-pio` 계정으로 인증돼 있어야 동작한다(아래 주의 참고).

---

## 되돌리는 법

다시 공개해야 할 일이 생기면 **반대 순서**로.

1. **Settings → Danger Zone → Change visibility → Make public**
2. **Settings → Pages → Source를 `Deploy from a branch`, 브랜치 `main` / 폴더 `/ (root)`** 로 지정
   - 저장소 루트의 `CNAME` 파일(`msandyj.store`)이 그대로 있으므로 커스텀 도메인은 자동으로 다시 잡힌다
3. **가비아 DNS 관리툴에서 위 표의 5개 레코드를 다시 등록**
4. GitHub Settings → Pages 에서 **Enforce HTTPS** 체크 (인증서 발급에 수십 분 걸릴 수 있음)

---

## 주의

- **`jayden-pio` 계정에만 admin 권한이 있다.** Pages 끄기와 visibility 변경은 이 계정으로만 가능하다. (`msandyj` 계정은 이 저장소에 읽기 권한만 있다.)
- DNS는 **가비아에서 직접** 지워야 한다. 가비아 도메인 API는 리셀러 파트너 전용이라 개인 계정용 DNS 레코드 API가 없다.
- private 전환 시 Pages는 **자동으로 내려간다.** DNS를 먼저 지우지 않은 상태에서 private으로 바꾸면 곧바로 `Site not found · GitHub Pages` 가 노출되니 순서를 지킬 것.

---

*작성 기준: 2026-09-21. 표의 IP·TTL·레코드 구성은 이 날짜에 실제 조회한 값이다.*
