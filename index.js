const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
require('dotenv').config(); // إذا كنت تستخدم متغيرات بيئية
const express = require('express'); // إضافة Express لتشغيل السيرفر
const axios = require('axios'); // لاستخدام API للحصول على الطقس والعملات

// إعداد سيرفر Express
const app = express();
const port = process.env.PORT || 4000;
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = process.env.TELEGRAM_BOT_TOKEN || '7201507244:AAFmUzJTZ0CuhWxTE_BjwQJ-XB3RXlYMKYU';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// قائمة معرفات المسؤولين
const adminIds = process.env.ADMIN_IDS?.split(',') || ['7719756994']; // إضافة معرف المسؤول

// الرد على أوامر البوت
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
        reply_markup: {
            keyboard: [
                [{ text: "🔍 البحث برقم الهوية أو الاسم" }],
                [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
                [{ text: "🌍 الخدمات الإضافية" }],
            ],
            resize_keyboard: true,
        },
    };
    bot.sendMessage(chatId, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

// التعامل مع الأزرار
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (text === "🔍 البحث برقم الهوية أو الاسم") {
        bot.sendMessage(chatId, "📝 أدخل رقم الهوية أو الاسم للبحث:");
    } else if (text === "📞 معلومات الاتصال") {
        const contactMessage = `
📞 **معلومات الاتصال:**
للمزيد من الدعم أو الاستفسار:
- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال: [0598550144]
- 💬 تلغرام: [https://t.me/AhmedGarqoud]
        `;
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
    } else if (text === "📖 معلومات عن البوت") {
        const aboutMessage = `
🤖 **معلومات عن البوت:**
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو الاسم.
هدفنا هو تسهيل الوصول إلى البيانات.
🔧 تم تطويره بواسطة [احمد محمد ابو غرقود].
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else if (text === "🌍 الخدمات الإضافية") {
        const servicesMessage = `
🌍 **الخدمات الإضافية**:
1. 🌤️ **أحوال الطقس**
2. 💵 **أخبار العملات**
اختر الخدمة التي تريدها الآن:
        `;
        bot.sendMessage(chatId, servicesMessage);
    } else if (text === "🌤️ أحوال الطقس") {
        const city = "Gaza,PS"; // مدينة غزة، فلسطين
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY`);
            const weather = response.data;
            const weatherMessage = `
🌤️ **حالة الطقس في غزة:**
- **الحرارة**: ${(weather.main.temp - 273.15).toFixed(2)}°C
- **الوصف**: ${weather.weather[0].description}
- **الرطوبة**: ${weather.main.humidity}%
            `;
            bot.sendMessage(chatId, weatherMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            bot.sendMessage(chatId, "❌ حدث خطأ أثناء جلب حالة الطقس. تأكد من إعداد API المفتاح.");
        }
    } else if (text === "💵 أخبار العملات") {
        try {
            const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
            const rates = response.data.rates;
            const currencyMessage = `
💵 **أسعار العملات الحالية مقابل الدولار الأمريكي:**
- **1 USD = ${rates.ILS.toFixed(2)} شيكل**
- **1 USD = ${rates.JOD.toFixed(2)} دينار أردني**
- **1 USD = ${rates.EGP.toFixed(2)} جنيه مصري**
            `;
            bot.sendMessage(chatId, currencyMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            bot.sendMessage(chatId, "❌ حدث خطأ أثناء جلب أسعار العملات.");
        }
    } else {
        bot.sendMessage(chatId, "❓ لم أفهم طلبك. يرجى اختيار أحد الخيارات من القائمة.");
    }
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
