
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

// قائمة المعرفات الخاصة بالمشرفين
const adminIds = process.env.ADMIN_IDS?.split(',') || ['7719756994', 'ADMIN_ID_2']; // ضع معرفات المسؤولين هنا

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// حالة الإرسال الجماعي
let isBroadcastMode = false;

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
    const chatId = msg.chat.id;
    const isAdmin = adminIds.includes(chatId.toString());

    const keyboard = [
        [{ text: "🔍 البحث برقم الهوية أو الاسم" }],
        [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
    ];

    // إذا كان المستخدم مسؤولًا، أضف زر "إرسال للجميع"
    if (isAdmin) {
        keyboard.push([{ text: "📢 إرسال رسالة للجميع" }]);
    }

    const options = {
        reply_markup: {
            keyboard,
            resize_keyboard: true, // ضبط الأزرار لتتناسب مع الحجم
            one_time_keyboard: false, // تجعل الأزرار مرئية دائمًا
        },
    };

    bot.sendMessage(chatId, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

// التعامل مع الضغط على الأزرار والرسائل
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim();
    const isAdmin = adminIds.includes(chatId.toString());

    // إذا كان المستخدم يطلب "إرسال رسالة للجميع"
    if (input === "📢 إرسال رسالة للجميع") {
        if (isAdmin) {
            isBroadcastMode = true; // تفعيل وضع الإرسال الجماعي
            bot.sendMessage(chatId, "✉️ اكتب الرسالة التي تريد إرسالها لجميع المستخدمين:");
        } else {
            bot.sendMessage(chatId, "⚠️ هذا الخيار متاح فقط للمسؤولين.");
        }
        return;
    }

    // إذا كان في وضع الإرسال الجماعي
    if (isBroadcastMode) {
        if (isAdmin) {
            const broadcastMessage = input; // حفظ الرسالة المدخلة
            isBroadcastMode = false; // إلغاء وضع الإرسال الجماعي بعد استلام الرسالة
            await sendMessageToAllUsers(broadcastMessage);
            bot.sendMessage(chatId, "✅ تم إرسال الرسالة للجميع.");
        }
        return;
    }

    // البحث في البيانات إذا لم يكن في وضع الإرسال الجماعي
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
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو الاسم.

- يمكنك البحث باستخدام رقم الهوية أو الاسم.
- يتم عرض تفاصيل المواطن بما في ذلك بيانات الموزع وحالة الطلب.

🔧 **التطوير والصيانة**: تم تطوير هذا البوت بواسطة [احمد محمد ابو غرقود].
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else {
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

// دالة إرسال رسالة جماعية
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
