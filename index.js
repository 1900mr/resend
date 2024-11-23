const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
require('dotenv').config(); // إذا كنت تستخدم متغيرات بيئية
const express = require('express'); // إضافة Express لتشغيل السيرفر
const axios = require('axios'); // لإجراء استدعاء API

// إعداد سيرفر Express (لتشغيل التطبيق على Render أو في بيئة محلية)
const app = express();
const port = process.env.PORT || 4000; // المنفذ الافتراضي
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = process.env.TELEGRAM_BOT_TOKEN || '7857872067:AAEDH3UChHfGDul0f0TdsPOoECbHv2HCDyQ';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// حفظ معرفات المستخدمين الذين يتفاعلون مع البوت
let userIds = new Set(); // Set للحفاظ على المعرفات الفريدة للمستخدمين

// دالة لتحميل البيانات من عدة ملفات Excel
async function loadDataFromExcelFiles(filePaths) {
    data = []; // إعادة تعيين المصفوفة لتجنب التكرار
    try {
        for (const filePath of filePaths) {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath); // قراءة الملف الحالي
            const worksheet = workbook.worksheets[0]; // أول ورقة عمل

            // الحصول على تاريخ آخر تعديل للملف
            const fileStats = require('fs').statSync(filePath); // قراءة بيانات الملف للحصول على تاريخ آخر تعديل
            const lastModifiedDate = fileStats.mtime.toISOString().split('T')[0]; // استخراج تاريخ آخر تعديل (YYYY-MM-DD)

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

                // إضافة البيانات مع تاريخ آخر تعديل كـ "تاريخ تسليم الجرة"
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
                        deliveryDate: lastModifiedDate, // تاريخ تسليم الجرة بناءً على تاريخ تعديل الملف
                    });
                }
            });
        }

        console.log('📁 تم تحميل البيانات من جميع الملفات بنجاح.');

        // إرسال تنبيه للمسؤولين
        sendMessageToAdmins("📢 تم تحديث البيانات من جميع الملفات بنجاح! يمكنك الآن البحث في البيانات المحدثة.");
    } catch (error) {
        console.error('❌ حدث خطأ أثناء قراءة ملفات Excel:', error.message);
    }
}

// استدعاء الدالة مع ملفات متعددة
const excelFiles = ['bur.xlsx', 'kan.xlsx', 'rfh.xlsx']; // استبدل بأسماء ملفاتك
loadDataFromExcelFiles(excelFiles);

// قائمة معرفات المسؤولين
const adminIds = process.env.ADMIN_IDS?.split(',') || ['7719756994']; // إضافة المعرفات الفعلية للمسؤولين

// الرد على أوامر البوت
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userIds.add(chatId); // حفظ معرف المستخدم

    const options = {
        reply_markup: {
            keyboard: [
                [{ text: "🔍 البحث برقم الهوية أو الاسم" }],
                [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
                // إضافة الأزرار الجديدة
                [{ text: "🌤️ أحوال الطقس" }, { text: "💰 أسعار العملات" }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
        },
    };

    if (adminIds.includes(chatId.toString())) {
        options.reply_markup.keyboard.push([{ text: "📢 إرسال رسالة للجميع" }]);
    }

    bot.sendMessage(chatId, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

// دالة للحصول على حالة الطقس
async function getWeather(city) {
    try {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.2fb04804fafc0c123fe58778ef5d878b}&units=metric&lang=ar`);
        const data = response.data;
        return `
🌤️ **حالة الطقس في ${data.name}**:
- درجة الحرارة: ${data.main.temp}°C
- حالة السماء: ${data.weather[0].description}
- الرطوبة: ${data.main.humidity}%
- الرياح: ${data.wind.speed} متر/ثانية
        `;
    } catch (error) {
        return "❌ لم أتمكن من الحصول على بيانات الطقس في هذه المدينة. يرجى المحاولة لاحقًا.";
    }
}

// دالة للحصول على أسعار العملات
async function getCurrencyRates() {
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.5884bd60fbdb6ea892ed9b76 }/latest/USD`);
        const data = response.data;
        return `
💰 **أسعار العملات الحالية**:
- 1 USD = ${data.conversion_rates.EGP} جنيه مصري
- 1 USD = ${data.conversion_rates.SAR} ريال سعودي
- 1 USD = ${data.conversion_rates.EUR} يورو
- 1 USD = ${data.conversion_rates.AED} درهم إماراتي
        `;
    } catch (error) {
        return "❌ لم أتمكن من الحصول على أسعار العملات. يرجى المحاولة لاحقًا.";
    }
}

// التعامل مع الضغط على الأزرار والبحث
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim(); // مدخل المستخدم

    if (input === '/start' || input.startsWith('/')) return; // تجاهل الأوامر الأخرى

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

- يتم عرض تفاصيل المواطن بما في ذلك بيانات الموزع وحالة الطلب.
- هدفنا هو تسهيل الوصول إلى البيانات.

🔧 **التطوير والصيانة**: تم تطوير هذا البوت بواسطة [احمد محمد ابو غرقود].
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else if (input === "🌤️ أحوال الطقس") {
        bot.sendMessage(chatId, "📡 جاري تحميل حالة الطقس...");
        const weather = await getWeather("Cairo"); // يمكنك تعديل المدينة هنا أو طلب المدينة من المستخدم
        bot.sendMessage(chatId, weather);
    } else if (input === "💰 أسعار العملات") {
        bot.sendMessage(chatId, "📡 جاري تحميل أسعار العملات...");
        const rates = await getCurrencyRates();
        bot.sendMessage(chatId, rates);
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
📅 **تاريخ تسليم الجرة**: ${user.deliveryDate}
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
