This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Konfigurasi Firebase (Wajib)

Aplikasi ini memakai Firebase Auth (Email/Password & Google), Cloud Firestore, dan Realtime Database. Semua kredensial dibaca dari environment variables — **tidak ada lagi fallback hardcoded**.

1. Salin `.env.example` menjadi `.env.local`.
2. Isi semua variabel `NEXT_PUBLIC_FIREBASE_*` dari Firebase Console → Project settings → General → Your apps.
3. Atur email admin di `NEXT_PUBLIC_ADMIN_EMAILS` (pisahkan dengan koma). Hanya email dalam daftar ini yang bisa masuk Panel Admin.
4. Aktifkan provider **Email/Password** dan **Google** di Firebase Console → Authentication → Sign-in method, lalu daftarkan akun admin asli (mis. `admin@galamerch.com`) melalui menu Users.

### Keamanan Database

File `firestore.rules` dan `database.rules.json` berisi aturan keamanan:

- Produk: bisa dibaca siapa pun, hanya admin yang bisa menulis.
- Pesanan: user hanya bisa membaca pesanannya sendiri; admin bisa membaca semua; guest hanya bisa membuat pesanan dengan `userId` berawalan `guest-`.

Deploy aturan dengan Firebase CLI:

```bash
firebase deploy --only firestore:rules,database
```

> Penting: daftar email admin di kedua file rules harus disinkronkan manual dengan `NEXT_PUBLIC_ADMIN_EMAILS`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
