// استيراد المكتبات
const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // مكتبة Excel
require('dotenv').config(); // متغيرات بيئية
const express = require('express'); // لتشغيل السيرفر

// إعداد سيرفر Express
const app = express();
const port = process.env.PORT || 4000; // منفذ السيرفر
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// إعداد التوكن
const token = process.env.TELEGRAM_BOT_TOKEN || '7203035834:AAEaT5eaKIKYnbD7jtlEijifCr7z7t1ZBL0';
const bot = new TelegramBot(token, { polling: true });

// تحديد معرف مدير البوت (لإرسال الرسائل الجماعية)
const ADMIN_ID = process.env.ADMIN_ID || '7719756994';

// تخزين بيانات Excel
let data = [];

// تحميل البيانات من Excel
async function loadDataFromExcel() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('gas18-11-2024.xlsx'); // اسم الملف
        const worksheet = workbook.worksheets[0];

        worksheet.eachRow((row, rowNumber) => {
            const idNumber = row.getCell(1).value?.toString().trim();
            const name = row.getCell(2).value?.toString().trim();
            const province = row.getCell(3).value?.toString().trim();
            const district = row.getCell(4).value?.toString().trim();
            const area = row.getCell(5).value?.toString().trim();
            const distributorId = row.getCell(6).value?.toString().trim();
            const distributorName = row.getCell(7).value?.toString().trim();
            const distributorPhone = row.getCell(8).value?.toString().trim();
            const status = row.getCell(9).value?.toString().trim();
            const orderDate = row.getCell(12).value?.toString().trim();

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

        console.log('✅ تم تحميل البيانات بنجاح.');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء قراءة ملف Excel:', error.message);
    }
}

// تحميل البيانات عند بدء التشغيل
loadDataFromExcel();

// إعداد لوحة المفاتيح الرئيسية
const mainMenu = {
    reply_markup: {
        keyboard: [
            [{ text: "🔍 البحث برقم الهوية أو الاسم" }],
            [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
            [{ text: "📢 إرسال رسالة للجميع" }] // الزر الرابع
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    },
};

// التعامل مع أوامر البوت
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "مرحبًا بك! اختر أحد الخيارات التالية:", mainMenu);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    if (input === "🔍 البحث برقم الهوية أو الاسم") {
        bot.sendMessage(chatId, "📝 أدخل رقم الهوية أو الاسم للبحث:");
    } else if (input === "📞 معلومات الاتصال") {
        const contactMessage = `
📞 **معلومات الاتصال:**
- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال : [0598550144]
- 💬 تلغرام : [https://t.me/AhmedGarqoud]
        `;
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
    } else if (input === "📖 معلومات عن البوت") {
        const aboutMessage = `
🤖 **معلومات عن البوت:**
- يتيح البوت البحث عن المواطنين باستخدام رقم الهوية أو الاسم.
- يعرض تفاصيل المواطن وبيانات الموزع وحالة الطلب.
- هذا البوت هو خدمة شخصية وغير حكومية.

🔧 **التطوير**: أحمد محمد أبو غرقود
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else if (input === "📢 إرسال رسالة للجميع") {
        if (chatId.toString() === ADMIN_ID) {
            bot.sendMessage(chatId, "✉️ اكتب الرسالة التي تريد إرسالها لجميع المستخدمين:");
            bot.once('message', async (msg) => {
                const broadcastMessage = msg.text.trim();
                await sendMessageToAllUsers(broadcastMessage);
                bot.sendMessage(chatId, "✅ تم إرسال الرسالة للجميع.");
            });
        } else {
            bot.sendMessage(chatId, "⚠️ هذا الخيار متاح فقط لمدير البوت.");
        }
    } else {
        // البحث في البيانات
        const user = data.find((entry) => entry.idNumber === input || entry.name === input);

        if (user) {
            const response = `
🔍 **تفاصيل الطلب:**

👤 **الاسم**: ${user.name}
📍 **المحافظة**: ${user.province}
🏙️ **المدينة**: ${user.district}
🏘️ **الحي / المنطقة**: ${user.area}

🆔 **هوية الموزع**: ${user.distributorId}  
📛 **اسم الموزع**: ${user.distributorName}
📞 **رقم جوال الموزع**: ${user.distributorPhone}

📜 **الحالة**: ${user.status}
📅 **تاريخ الطلب**: ${user.orderDate}
            `;
            bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات للمدخل المقدم.");
        }
    }
});

// إرسال رسالة جماعية
async function sendMessageToAllUsers(message) {
    try {
        const updates = await bot.getUpdates();
        const uniqueChatIds = [...new Set(updates.map(update => update.message?.chat.id).filter(Boolean))];

        for (const chatId of uniqueChatIds) {
            await bot.sendMessage(chatId, message);
        }
        console.log("✅ تم إرسال الرسالة للجميع.");
    } catch (error) {
        console.error("❌ حدث خطأ أثناء إرسال الرسائل:", error.message);
    }
}

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
