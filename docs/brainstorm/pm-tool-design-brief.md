# Design Brief — Solo Dev PM Tool

> Tài liệu cho Claude Design. Chỉ tập trung UI/UX & visual direction.
> (Schema/API/backend nằm ở tài liệu spec riêng — không thuộc phạm vi design.)

---

## 1. Sản phẩm là gì

Tool quản lý project cá nhân cho **một solo indie dev**. Không có gì của team:
không assignee, không avatar người khác, không mention, không notification,
không "assigned to me". Mọi thứ là của một người.

Người dùng quản lý **task** thuộc nhiều **project**, nhóm task theo 2 trục độc lập:
- **Module** = sub-system (vd "Core Workflow", "Onboarding Flow")
- **Milestone** = phase (vd "Initial", "Core logic", "Launch") — có deadline

Tương tác trung tâm: click task → **panel chi tiết trượt từ phải**, không rời list.

---

## 2. Visual Direction

**Tham chiếu chính: Asana.** Tinh thần:
- Thoáng, nhiều whitespace, không dày đặc. Dễ thở.
- Nền sáng, màu accent nhẹ nhàng (không chói, không neon).
- List-row sạch: thông tin chính rõ, thông tin phụ ẩn cho tới khi hover.
- Bo góc mềm vừa phải, shadow rất nhẹ (subtle elevation, không đổ bóng nặng).
- Typography rõ ràng, dễ đọc, cỡ chữ thoải mái (không nhồi nhét).
- Cảm giác: bình tĩnh, gọn gàng, "ít mà đủ".

**Theme: Light mode trước.** (Dark làm sau — chọn token màu sao cho sau này
swap sang dark dễ, đừng hardcode màu.)

**Không muốn:** đậm đặc kiểu Linear/Jira, nhiều đường kẻ chia ô, nhiều badge
chen chúc, toolbar rậm rạp.

### Color & accent
- Mỗi **project** có 1 màu + 1 **emoji icon** (vd 🚀) → dùng để nhận diện nhanh ở sidebar.
- Mỗi **module** có 1 màu (chấm tròn nhỏ cạnh tên).
- **Status** và **priority** dùng màu nhẹ, nhất quán (xem §6).
- Accent tổng thể: một màu chủ đạo thiên hướng dịu (Asana hay dùng coral/xanh
  — bạn chọn, nhưng giữ độ bão hòa vừa phải).

---

## 3. Cấu trúc Layout

3 vùng dọc:

```
┌────────────┬──────────────────────────────┬─────────────┐
│  LEFT NAV  │   MAIN (list / board)        │  DETAIL     │
│            │                              │  PANEL      │
│ 🚀 Proj A  │  [ + Quick capture input  ]  │  (slide-in  │
│ 📚 Proj B  │                              │   từ phải)  │
│ 📥 Inbox 3 │  Group: [Module ▾] [Milestone]│            │
│            │                              │             │
│ + New      │  ▸ Module section            │             │
│            │      task row                │             │
│            │      task row                │             │
└────────────┴──────────────────────────────┴─────────────┘
```

- **Left nav** hẹp: danh sách project (emoji + tên + màu), mục **Inbox** có badge số.
- **Main**: ô quick-capture trên cùng + danh sách task nhóm theo Module/Milestone.
- **Detail panel**: overlay trượt từ phải khi click task; main vẫn thấy phía sau.

---

## 4. Các màn hình cần design

### 4.1 Main — Task List (màn chính)
- Trên cùng: **ô Quick Capture** luôn hiện — placeholder kiểu "Thêm task nhanh…",
  gõ + Enter là xong, không bắt chọn gì. (Nếu đang trong project → task vào project đó;
  nếu ở Inbox → vào Inbox.)
- Thanh nhẹ: nút **Group by** toggle (Module ⇄ Milestone), filter (status, priority),
  toggle ẩn done. Giữ thanh này tối giản, không rậm.
- **Section theo nhóm**: mỗi Module (hoặc Milestone) là một section có:
  - header: chấm màu + tên + đếm số task + thanh/% hoàn thành nhỏ
  - các **task row** bên dưới
  - dòng "+ add task" inline ở cuối section
- **Task row** (quan trọng — đây là thứ nhìn nhiều nhất): hiển thị gọn
  - checkbox tròn (tick = done) bên trái
  - title (đậm vừa)
  - ref "PRJA-3" mờ nhẹ
  - priority (chip/màu nhỏ), due date (nếu có), milestone hoặc module tag nhỏ
  - **các thứ phụ ẩn bớt, hiện rõ khi hover**; hover làm sáng nền row nhẹ
- Section cuối: **No Module / No Milestone** (task chưa phân loại trong project).

### 4.2 Detail Panel (slide-in từ phải) — tương tác cốt lõi
Thứ tự từ trên xuống:
1. Hàng đầu: ref "PRJA-3" (bấm copy) + nút đóng (×). Esc cũng đóng.
2. **Title** — chỉnh sửa inline ngay tại chỗ.
3. **Status Note** — ô nổi bật, nhãn kiểu "Đang vướng gì / tiến độ?" — 1 dòng
   trạng thái hiện tại, sửa nhanh. (Khác comment — đây là cái ghi đè, luôn thấy.)
4. Hàng thuộc tính: **Status · Priority · Module · Milestone · Due date** —
   mỗi cái là một control nhỏ gọn (dropdown/popover), bố trí thoáng.
5. **Description** — vùng markdown lớn hơn, viết chi tiết.
6. **Activity / Timeline** — danh sách **comment** append theo thời gian (nhật ký
   cho chính mình: "3/6: thử cách A, fail vì X"). Mỗi comment có thể có badge
   nguồn nhỏ (web / api / agent) — agent = do AI tạo.
   Ô thêm comment ở dưới cùng.
7. Nút **Delete** (cần xác nhận).

→ Phân biệt rõ trong design: **Status Note** (1 dòng, nổi, ghi đè) vs
  **Comments** (nhiều dòng, lịch sử, append). Đừng làm chúng trông giống nhau.

### 4.3 Inbox
- Route/màn riêng, vào từ left nav (có badge số task chưa triage).
- List các task chưa phân loại (chưa thuộc project nào).
- Mỗi row có hành động nhanh: **gán vào project** (→ rồi mới chọn module/milestone).
- Tinh thần: nơi "đổ ý tưởng" rồi dọn sau. Nhẹ nhàng, không áp lực.

### 4.4 Board (Kanban) — view phụ
- Toggle với List. Cột theo **status** (Backlog · Todo · In progress · Blocked · Done).
- Card kéo-thả giữa cột = đổi status. Card gọn: title + ref + priority + tags nhỏ.
- Giữ phong cách Asana board (thoáng, card sạch, không viền nặng).

### 4.5 Milestones management
- Màn quản lý phase của một project: list milestone, mỗi cái có tên, **target date**,
  trạng thái (Planned / Active / Done), % hoàn thành.
- Cho tạo/sửa/sắp thứ tự.

### 4.6 Modules management
- Tương tự nhưng cho sub-system: tên + màu + sắp thứ tự. Đơn giản hơn milestone
  (không có date).

### 4.7 Project create/edit
- Form gọn: tên, **emoji icon picker**, màu, key (vd "PRJA" — chữ hoa, dùng cho ref),
  mô tả, **status note** ("project đang ở đâu").

### 4.8 Login (tối giản)
- Một ô password, một nút. Không signup, không "quên mật khẩu", không social.
  Chỉ là cửa khóa. Giữ thật sạch và nhỏ.

---

## 5. Tương tác & cảm giác

- **Quick capture** là ngôi sao: phải nhanh, không ma sát, luôn trong tầm tay.
- **Hover-reveal**: row gọn khi tĩnh, lộ thêm action/metadata khi hover (rất Asana).
- **Inline edit**: sửa title, status, priority ngay tại chỗ, không mở modal nặng.
- **Detail panel trượt mượt**, đóng bằng Esc hoặc click ra ngoài.
- **Keyboard**: phím `c` mở quick-add ở đâu cũng được (gợi ý hiển thị hint nhẹ).
- Trạng thái rỗng (empty state) thân thiện, có gợi ý hành động (vd Inbox trống:
  "Chưa có gì ở đây — gõ ý tưởng vào ô trên để bắt đầu").
- Chuyển động tinh tế, không hoa mỹ.

---

## 6. Status & Priority (màu sắc nhất quán)

**Status** (7): Inbox · Backlog · Todo · In progress · **Blocked** · Done · Cancelled
- Mỗi status có màu/icon riêng, nhẹ nhàng. Blocked nên hơi nổi (đỏ/cam dịu) vì
  nó báo "đang kẹt" — đi kèm Status Note.
- Done/Cancelled trông "đã nguội" (xám, mờ, gạch ngang title tùy ý).

**Priority** (5): None · Low · Medium · High · Urgent
- Thang màu tăng dần độ chú ý (None = không màu/xám tới Urgent = đậm nhất).
- Hiển thị nhỏ gọn ở row (chip hoặc icon), đừng để lấn át title.

---

## 7. Nguyên tắc xuyên suốt

1. **Ít mà đủ** — luôn ưu tiên gỡ bớt thay vì thêm. Đây là lý do tool tồn tại
   (chán Jira/Linear vì rườm rà).
2. **Một người** — không bao giờ có UI cho người thứ hai.
3. **Hai trục độc lập** — Module (sub-system) và Milestone (phase) phải nhìn ra
   ngay là hai thứ khác nhau, không lẫn.
4. **Status Note ≠ Comments** — cái nổi (đang sao) khác cái chìm (đã qua gì).
5. **Capture trước, sắp sau** — Inbox & quick-add giảm ma sát ghi ý tưởng.
6. **Light mode, token-based màu** — để swap dark sau mà không sửa khắp nơi.
