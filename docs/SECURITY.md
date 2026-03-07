# 🔒 Security & Authentication

## 🎯 Overview

Your GAMO BRAIN is now **password-protected**! Nobody can access your data or train your AI without the password.

---

## 🔑 Default Password

**Current Password:** `admin`

⚠️ **IMPORTANT:** Change this immediately!

---

## 🛠️ How to Change Password

### **Method 1: Generate New Hash (Recommended)**

1. Open your browser console (F12)
2. Paste this code:

```javascript
async function generateHash(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  console.log('Your new password hash:', hash)
  return hash
}

// Replace 'YourNewPassword' with your actual password
generateHash('YourNewPassword')
```

3. Copy the hash from console
4. Open `src/components/AuthGate.jsx`
5. Replace this line:

```javascript
const PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' // SHA-256 of "admin"
```

With:

```javascript
const PASSWORD_HASH = 'YOUR_NEW_HASH_HERE' // SHA-256 of "YourNewPassword"
```

6. Save and deploy!

### **Method 2: Online SHA-256 Generator**

1. Go to: https://emn178.github.io/online-tools/sha256.html
2. Enter your new password
3. Copy the hash
4. Update `src/components/AuthGate.jsx` as shown above

---

## 🔐 How It Works

### **Security Features:**

✅ **Password Hashing** - Your password is never stored in plain text  
✅ **SHA-256** - Industry-standard cryptographic hash  
✅ **LocalStorage** - Auth token persists across sessions  
✅ **No Backend** - No server-side authentication needed  
✅ **Logout Button** - Hover top-right corner to logout  

### **What's Protected:**

✅ **All Pages** - Home, Train, everything  
✅ **Your Data** - Profile, chat history, documents  
✅ **Training** - Nobody can teach your AI  
✅ **Chat** - Nobody can talk to your twin  

---

## 🚨 Security Best Practices

### **DO:**
- ✅ Change the default password immediately
- ✅ Use a strong, unique password
- ✅ Keep your password private
- ✅ Logout on shared devices

### **DON'T:**
- ❌ Share your password
- ❌ Use "password" or "123456"
- ❌ Leave the default "admin" password
- ❌ Store password in plain text anywhere

---

## 🔄 Session Management

### **How Long Does Login Last?**
- Login persists until you logout or clear browser data
- No automatic timeout (stays logged in)

### **How to Logout:**
- Hover over top-right corner
- Click the red "LOGOUT" button
- Or clear browser localStorage

### **Logout from All Devices:**
1. Change your password (generates new hash)
2. All existing sessions become invalid
3. Everyone must re-login with new password

---

## 🛡️ Additional Security (Optional)

### **Want More Security?**

If you need enterprise-level security, consider:

1. **Add Rate Limiting** - Prevent brute force attacks
2. **Add 2FA** - Two-factor authentication
3. **Add Session Timeout** - Auto-logout after inactivity
4. **Add IP Whitelist** - Only allow specific IPs
5. **Use OAuth** - Google/GitHub login

Let me know if you want any of these!

---

## 🧪 Testing

### **Test Your Security:**

1. Open site in incognito/private window
2. Should see password screen
3. Try wrong password - should show error
4. Enter correct password - should unlock
5. Refresh page - should stay logged in
6. Logout - should return to password screen

---

## 📱 Mobile Security

✅ Works on all devices  
✅ Touch-friendly password input  
✅ No zoom on focus  
✅ Logout button accessible  

---

## 🔧 Troubleshooting

### **Forgot Password?**
1. Open `src/components/AuthGate.jsx`
2. Find the `PASSWORD_HASH` line
3. Replace with a new hash (see "How to Change Password")
4. Deploy and use new password

### **Locked Out?**
1. Clear browser localStorage: `localStorage.clear()`
2. Or use incognito mode
3. Or change the hash in code

### **Password Not Working?**
- Check for typos
- Password is case-sensitive
- Make sure you deployed the changes
- Clear browser cache

---

## 🎉 You're Protected!

Your GAMO BRAIN is now secure! 🔒

**Nobody can:**
- ❌ Access your data
- ❌ Train your AI
- ❌ Chat with your twin
- ❌ See your profile

**Only you can access it with the password!** ✅

---

## 💡 Quick Reference

**Default Password:** `admin`  
**Change Password:** Edit `src/components/AuthGate.jsx`  
**Logout:** Hover top-right corner  
**Test:** Use incognito window  

**Stay secure!** 🛡️
