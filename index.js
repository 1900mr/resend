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
const token = process.env.TELEGRAM_BOT_TOKEN || 'AAEaT5eaKIKYnbD7jtlEijifCr7z7t1ZBL0';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// حفظ معرفات المستخدمين الذين يتفاعلون مع البوت
let userIds = new Set(); // Set للحفاظ على المعرفات الفريدة للمستخدمين

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

        // إرسال تنبيه للمستخدمين بأن البيانات تم تحديثها
        sendMessageToAdmins("📢 تم تحديث البيانات بنجاح! يمكنك الآن البحث في البيانات المحدثة.");
    } catch (error) {
        console.error('حدث خطأ أثناء قراءة ملف Excel:', error.message);
    }
}

// تحميل البيانات عند بدء التشغيل
loadDataFromExcel();

// قائمة معرفات المسؤولين
const adminIds = process.env.ADMIN_IDS?.split(',') || ['7719756994']; // إضافة المعرفات الفعلية للمسؤولين

// الرد على أوامر البوت
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    // حفظ المعرفات للمستخدمين الجدد الذين يبدأون التفاعل
    userIds.add(chatId);

    const options = {
        reply_markup: {
            keyboard: [
                [{ text: "🔍 البحث برقم الهوية أو الاسم" }],
                [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
            ],
            resize_keyboard: true, // ضبط الأزرار لتتناسب مع الحجم
            one_time_keyboard: false, // تجعل الأزرار مرئية دائمًا
        },
    };

    // إضافة الزر "إرسال رسالة للجميع" للمسؤولين فقط
    if (adminIds.includes(chatId.toString())) {
        options.reply_markup.keyboard.push([{ text: "📢 إرسال رسالة للجميع" }]);
    }

    bot.sendMessage(chatId, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

// التعامل مع الضغط على الأزرار
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim(); // مدخل المستخدم

    if (input === '/start' || input.startsWith('/')) return; // تجاهل الأوامر الأخرى

    // التعامل مع الأزرار
    if (input === "🔍 البحث برقم الهوية أو الاسم") {
        bot.sendMessage(chatId, "📝 أدخل رقم الهوية أو الاسم للبحث:");
    } else if (input === "📞 معلومات الاتصال") {
        const contactMessage = `
📞 **معلومات الاتصال:**
للمزيد من الدعم أو الاستفسار، يمكنك التواصل معنا عبر:

- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال : [0598550144]
- 💬 تلغرام : [https://t.me/AhmedGarqoud]
        `;
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
    } else if (input === "📖 معلومات عن البوت") {
        const aboutMessage = `
🤖 **معلومات عن البوت:**
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو الاسم

- يمكنك البحث باستخدام رقم الهوية أو الاسم.
- يتم عرض تفاصيل المواطن بما في ذلك بيانات الموزع وحالة الطلب.

هدفنا هو تسهيل الوصول إلى البيانات من خلال هذه الخدمة.
هذه الخدمة ليست حكومية وانما خدمة من جهد شخصي

🔧 **التطوير والصيانة**: تم تطوير هذا البوت بواسطة [احمد محمد ابو غرقود].
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else if (input === "📢 إرسال رسالة للجميع" && adminIds.includes(chatId.toString())) {
        bot.sendMessage(chatId, "✉️ اكتب الرسالة التي تريد إرسالها لجميع المستخدمين:");
        bot.once('message', (broadcastMsg) => {
            const broadcastText = broadcastMsg.text;
            sendBroadcastMessage(broadcastText, chatId);
        });
    } else {
        const user = data.find((entry) => entry.idNumber === input || entry.name === input);

        if (user) {
            const response = `
🔍 **تفاصيل الطلب:**

👤 **الاسم**: ${user.name}
🏘️ **الحي / المنطقة**: ${user.area}
🏙️ **المدينة**: ${user.district}
📍 **المحافظة**: ${user.province}

📛 **اسم الموزع**: ${user.distributorName}
📞 **رقم جوال الموزع**: ${user.distributorPhone}
🆔 **هوية الموزع**: ${user.distributorId}

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
async function sendBroadcastMessage(message, adminChatId) {
    userIds.forEach(userId => {
        bot.sendMessage(userId, message);
    });
    bot.sendMessage(adminChatId, "✅ تم إرسال الرسالة للجميع بنجاح.");
}

// إرسال تنبيه للمسؤولين
function sendMessageToAdmins(message) {
    adminIds.forEach(adminId => {
        bot.sendMessage(adminId, message);
    });
}

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
