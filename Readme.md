# Campus Rental Platform – IIT Ropar Student Community App (UniSwap)

A centralized campus-only peer-to-peer rental and accountability platform for students. Designed to simplify listing, proposals, transactions, reputation, and automated reminders within an institute community.

---

## 🎯 Objective

* 🏫 Solve rental coordination challenges for students on campus
* 🔄 Enable *peer-to-peer renting* for books, electronics, tools, and more
* ✅ Ensure accountability using the **TrustScore reputation system**
* 💬 Seamless negotiation via **in-app chat and rental proposals**
* 🤝 Build a self-sustained and reliable rental ecosystem

---

## 🚀 Features

### 📌 1. Easy Item Listing

* Quick item listing with **title, description, and pricing**
* Upload **photos** to showcase item condition and quality
* Set **availability dates** and rental terms
* Select category like:

  * 📚 Books
  * ⚡ Electronics
  * 🔧 Tools
  * 🎒 Campus Gear
  * 🧰 Others
* **Preview listing before posting** for validation
* Designed for **fast setup by any student**

### 💬 2. In-App Chat & Rental Proposals

* Built-in **real-time messaging** between borrower and owner
* **Propose rental dates** directly within chat
* **Negotiate rental duration and price** interactively
* Chat history stored for transparency and dispute resolution
* Removes dependency on third-party communication apps

### 🔢 3. TrustScore Reputation System

* Every new user begins with a **TrustScore of 100 points**
* Trust dynamically updated post-transaction:

  * ✅ **+20 points → Returned on time**
  * ❌ **−20 points → Returned late (past due date)**
* Score updated only after **owner confirmation** (avoiding abuse)
* TrustScore visible on each student **Profile Screen**
* Acts as the primary measure of **borrowing credibility**

### ⏰ 4. Automated Reminders & Overdue Handling

* **Daily cron job at midnight (Asia/Kolkata)** checks active rentals
* **Email reminders sent 1 day before due date** 
* Overdue rentals flagged and penalized via TrustScore reduction
* Ensures the platform remains self-managed

### 👤 5. Campus-Only User Access Control

* Restricts signup to institute domain **@iitrpr.ac.in** (server enforced)
* Only student emails allowed with OTP verification
* Prevents external or non-student registrations

---

## 🛠️ Tech Stack Used

* **Frontend:** ReactJS (responsive UI, fast rendering, modular components)
* **Backend:** Node.js + Firebase Cloud Functions (Auth triggers, API endpoints, scheduled cron)
* **Email API:** SendGrid (`@sendgrid/mail`)
* **Database:** Firestore 
---

## 📊 Campus Adoption Metrics

* 108+ registered campus users so far
---





### Preview 
![WhatsApp Image 2025-11-28 at 09 21 52](https://github.com/user-attachments/assets/fe84dfc2-25c4-41d9-b3b2-d3d7eec63fb1)

![WhatsApp Image 2025-11-28 at 09 21 52 (1)](https://github.com/user-attachments/assets/42220d03-f6ec-4d97-92a6-579d9061f86b)
![WhatsApp Image 2025-11-28 at 09 23 18](https://github.com/user-attachments/assets/135534c0-75a9-48ef-9a5d-79c2975cab53)


<img width="1007" height="532" alt="image" src="https://github.com/user-attachments/assets/23274c69-24b6-4ba4-b6eb-098190285bf7" />
<img width="1024" height="570" alt="image" src="https://github.com/user-attachments/assets/414670bf-0755-4e57-af34-cd6f55f13e7b" />

<img width="1011" height="505" alt="image" src="https://github.com/user-attachments/assets/8152a259-1c15-49f4-afa7-609e2dc85a1b" />
<img width="1002" height="539" alt="image" src="https://github.com/user-attachments/assets/fe11455e-ab6e-4dc1-b982-6a0391d13314" /><img width="781" height="535" alt="image" src="https://github.com/user-attachments/assets/7dc85ad6-b251-41e7-8506-4bc0ea2d9233" />


