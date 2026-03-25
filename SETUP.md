# วิธี Setup HuaHed Document Hub (แบบละเอียดมาก)

---

## ขั้นตอนที่ 1: สร้าง Firebase Project

1. เปิดเว็บ https://console.firebase.google.com
2. Login ด้วย Google account ของบริษัท
3. กด **Create a project** (สร้างโปรเจค)
4. ตั้งชื่อ: `HuaHed-Document-Hub`
5. Google Analytics → เลือก **ไม่เปิด** ก็ได้ (ไม่จำเป็น) แล้วกด **Create project**
6. รอ 30 วินาที จนขึ้น "Your new project is ready" แล้วกด **Continue**

---

## ขั้นตอนที่ 2: เปิด Authentication (ระบบ Login)

1. เมนูด้านซ้าย กด **Build** > **Authentication**
2. กด **Get started**
3. กด tab **Sign-in method**
4. กด **Google** > สลับเป็น **Enable** (เปิดใช้งาน)
5. เลือก **Support email** เป็น email ของคุณ
6. กด **Save**

เพียงเท่านี้! ระบบ Login ด้วย Google พร้อมใช้งานแล้ว

---

## ขั้นตอนที่ 3: สร้าง Firestore Database (ฐานข้อมูล)

1. เมนูด้านซ้าย กด **Build** > **Firestore Database**
2. กด **Create database**
3. เลือก Location: **asia-southeast1 (Singapore)** แล้วกด **Next**
4. เลือก **Start in production mode** แล้วกด **Create**
5. รอจนสร้างเสร็จ

### ตั้งค่า Security Rules
1. กด tab **Rules**
2. ลบข้อความเดิมทั้งหมด
3. Copy ข้อความจากไฟล์ `firestore.rules` ในโปรเจค แล้ววางลงไป
4. กด **Publish**

---

## ขั้นตอนที่ 4: เปิด Firebase Storage (เก็บไฟล์)

1. เมนูด้านซ้าย กด **Build** > **Storage**
2. กด **Get started**
3. เลือก **Start in production mode** แล้วกด **Next**
4. เลือก Location: **asia-southeast1** แล้วกด **Done**

### ตั้งค่า Storage Rules
1. กด tab **Rules**
2. ลบข้อความเดิมทั้งหมด
3. Copy ข้อความจากไฟล์ `storage.rules` ในโปรเจค แล้ววางลงไป
4. กด **Publish**

---

## ขั้นตอนที่ 5: Copy ค่า Config มาใส่โปรเจค

1. ไปที่ **Project Settings** (ไอคอนฟันเฟือง ข้าง Project Overview)
2. เลื่อนลง หา **Your apps** กด **</>** (Web app)
3. ตั้งชื่อ: `HuaHed Doc Hub` แล้วกด **Register app**
4. จะเห็นโค้ดที่มีค่า config แบบนี้:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "huahed-document-hub.firebaseapp.com",
  projectId: "huahed-document-hub",
  storageBucket: "huahed-document-hub.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจค (อยู่ข้างๆ package.json)
6. ใส่ค่าจากข้อ 4 ลงไปแบบนี้:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=huahed-document-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=huahed-document-hub
VITE_FIREBASE_STORAGE_BUCKET=huahed-document-hub.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## ขั้นตอนที่ 6: ทดสอบบนเครื่อง

1. เปิด Terminal
2. พิมพ์:
```bash
npm install
npm run dev
```
3. เปิด browser ไปที่ http://localhost:5173
4. กด **"เข้าสู่ระบบด้วย Google"** (ถ้ายังไม่มี Firebase ให้กด "เข้าสู่ระบบแบบ Demo")
5. ถ้าเข้าหน้าหลักได้ = สำเร็จ!

---

## ขั้นตอนที่ 7: Deploy ขึ้น Netlify (ให้ทุกคนเข้าใช้ได้)

1. เปิด https://app.netlify.com แล้วสมัคร/Login ด้วย GitHub
2. กด **Add new site** > **Import an existing project**
3. เลือก **GitHub** แล้วเลือก repo **HH-Directory**
4. ตั้งค่า:
   - **Branch:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. กด **Show advanced** > **New variable** แล้วเพิ่มค่า VITE_FIREBASE_... ทั้ง 6 ตัว (เหมือนในไฟล์ .env)
6. กด **Deploy site**
7. รอ 1-2 นาที จะได้ URL เช่น `https://hh-doc-hub.netlify.app`

### เพิ่ม Domain ใน Firebase
1. กลับไป Firebase Console > **Authentication** > **Settings** > tab **Authorized domains**
2. กด **Add domain**
3. ใส่ domain จาก Netlify เช่น `hh-doc-hub.netlify.app`
4. กด **Add**

---

## ขั้นตอนที่ 8: ตั้งค่า Admin

1. ใน Firebase Console > **Firestore Database**
2. กด collection **users**
3. หา document ของตัวเอง (ดูจาก email)
4. กด edit field **role** เปลี่ยนจาก `staff` เป็น `admin`
5. ตอนนี้คุณจะเห็นเมนู **Admin** ในเว็บแล้ว

---

## เริ่มใช้งาน!

1. เปิดเว็บที่ deploy แล้ว
2. Login ด้วย email @huahed.com หรือ @procandid.com
3. กดปุ่ม **อัปโหลด** > **วางลิงก์** > ใส่ลิงก์ Google Drive > เลือกหมวดหมู่ > เสร็จ!

---

## ถ้าติดปัญหา

| ปัญหา | วิธีแก้ |
|---|---|
| Login แล้วขึ้น "กรุณาใช้ email บริษัทเท่านั้น" | ต้อง login ด้วย @huahed.com หรือ @procandid.com เท่านั้น |
| กด Login แล้วไม่มีอะไรเกิดขึ้น | เช็คว่าใส่ค่า Firebase config ใน .env ถูกต้อง |
| เว็บขึ้นหน้าว่าง | เปิด Console (F12) ดู error แล้วถ่ายรูปมาถาม |
| อัปโหลดไฟล์ไม่ได้ | เช็คว่าเปิด Firebase Storage แล้ว และ deploy rules แล้ว |
