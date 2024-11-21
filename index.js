const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
require('dotenv').config(); // إذا كنت تستخدم متغيرات بيئية
const express = require('express'); // إضافة Express لتشغيل السيرفر

// إعداد سيرفر Express (لتشغيل التطبيق على Render أو في بيئة محلية)
const app = express();
const port = process.env.PORT || 4000; // المنفذ الافتراضي
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// دالة لتحميل البيانات من Excel
async function loadDataFromExcel() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('gas18-11-2024.xlsx'); // اسم الملف
        const worksheet = workbook.worksheets[0]; // أول ورقة عمل

        worksheet.eachRow((row, rowNumber) => {
            const idNumber = row.getCell(1).value?.toString().trim(); // رقم الهوية
            const name = row.getCell(2).value?.toString().trim(); // اسم المواطن
            const province = row.getCell(3).value?.toString().trim(); // المحافظة
            const district = row.getCell(4).value?.toString().trim(); // المدينة
            const area = row.getCell(5).value?.toString().trim(); // الحي/المنطقة
            const distributorId = row.getCell(6).value?.toString().trim(); // هوية الموزع
            const distributorName = row.getCell(7).value?.toString().trim(); // اسم الموزع
            const distributorPhone = row.getCell(8).value?.toString().trim(); // رقم جوال الموزع
            const status = row.getCell(9).value?.toString().trim(); // الحالة
            const orderDate = row.getCell(12).value?.toString().trim(); // تاريخ الطلب

            if (idNumber && name) {
                data.push({
                    idNumber,
                    name,
                    province: province || "غير متوفر",
                    district: district || "غير متوفر",
                    area: area || "غير متوفر",
                    distributorId: distributorId || "غير متوفر",
                    distributorName: distributorName || "غير متوفر",
                    distributorPhone: distributorPhone || "غير متوفر",
                    status: status || "غير متوفر",
                    orderDate: orderDate || "غير متوفر",
                });
            }
        });

        console.log('تم تحميل البيانات بنجاح.');
    } catch (error) {
        console.error('حدث خطأ أثناء قراءة ملف Excel:', error.message);
    }
}

// تحميل البيانات عند بدء التشغيل
loadDataFromExcel();

// الرد على أوامر البوت
bot.onText(/\/start/, (msg) => {
    const options = {
        reply_markup: {
            keyboard: [
                ["🔍 البحث بالرقم", "📋 البحث المتقدم"],
                ["📖 معلومات عن البوت", "📞 معلومات الاتصال"],
            ],
            resize_keyboard: true, // جعل الأزرار أصغر حجمًا
            one_time_keyboard: false, // عدم إخفاء لوحة المفاتيح بعد اختيار زر
        },
    };
    bot.sendMessage(msg.chat.id, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

// التعامل مع الأزرار السريعة
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    if (input === "🔍 البحث بالرقم") {
        bot.sendMessage(chatId, "📝 أدخل رقم الهوية للبحث:");
    } else if (input === "📋 البحث المتقدم") {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔍 البحث حسب المحافظة", callback_data: 'search_by_province' }],
                    [{ text: "🔍 البحث حسب المدينة", callback_data: 'search_by_city' }],
                    [{ text: "🔍 البحث حسب الحالة", callback_data: 'search_by_status' }],
                ],
            },
        };
        bot.sendMessage(chatId, "🔍 اختر معيار البحث:", options);
    } else if (input === "📖 معلومات عن البوت") {
        const aboutMessage = `
🤖 **معلومات عن البوت:**
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو معايير أخرى.

هدفنا هو تسهيل الوصول إلى البيانات.
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else if (input === "📞 معلومات الاتصال") {
        const contactMessage = `
📞 **معلومات الاتصال:**
- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال: [0598550144]
        `;
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
    }
});

// التعامل مع البحث المتقدم
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'search_by_province') {
        bot.sendMessage(chatId, "📝 أدخل اسم المحافظة للبحث:");
    } else if (query.data === 'search_by_city') {
        bot.sendMessage(chatId, "📝 أدخل اسم المدينة للبحث:");
    } else if (query.data === 'search_by_status') {
        bot.sendMessage(chatId, "📝 أدخل الحالة (مثال: مكتمل / قيد الانتظار) للبحث:");
    }
});

// البحث باستخدام المعايير
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    // البحث حسب الرقم أو اسم المواطن
    const user = data.find((entry) => entry.idNumber === input || entry.name === input);

    if (user) {
        const response = `
🔍 **تفاصيل الطلب:**

👤 **الاسم**: ${user.name}
📍 **المحافظة**: ${user.province}
🏙️ **المدينة**: ${user.district}
🏘️ **الحي / المنطقة**: ${user.area}

📛 **اسم الموزع**: ${user.distributorName}
🆔 **هوية الموزع**: ${user.distributorId}  
📞 **رقم جوال الموزع**: ${user.distributorPhone}

📜 **الحالة**: ${user.status}
📅 **تاريخ الطلب**: ${user.orderDate}
        `;
        bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات للمدخل المقدم.");
    }
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
