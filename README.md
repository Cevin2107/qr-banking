# 🏦 QR Banking - Tạo Mã QR Chuyển Khoản

Ứng dụng web tạo mã QR chuyển khoản ngân hàng theo chuẩn **VietQR**, số tiền cố định, dễ sử dụng.

## ✨ Tính năng

- ✅ Hỗ trợ 15+ ngân hàng phổ biến Việt Nam
- ✅ Lưu thông tin tài khoản tự động (Local Storage)
- ✅ Tạo mã QR với số tiền cố định (không thể sửa)
- ✅ Tải xuống mã QR dạng PNG
- ✅ Giao diện đẹp, responsive
- ✅ Deploy miễn phí lên Vercel

## 🚀 Cài đặt

```bash
# Clone repo
git clone https://github.com/Cevin2107/qr-banking.git
cd qr-banking

# Cài đặt dependencies
npm install

# Chạy local (cần Vercel CLI)
npm install -g vercel
vercel dev
```

## 📦 Deploy lên Vercel

```bash
# Login Vercel
vercel login

# Deploy
vercel --prod
```

## 🛠️ Công nghệ

- Node.js + Vercel Serverless Functions
- VietQR Standard (EMVCo)
- QRCode.js
- Vanilla JavaScript

## 📝 License

MIT © Cevin2107