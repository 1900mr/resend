const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
const express = require('express'); // إضافة Express لتشغيل السيرفر
const axios = require('axios'); // لإجراء استدعاء API
const { google } = require('googleapis'); // إضافة مكتبة Google API

// إعداد سيرفر Express (لتشغيل التطبيق على Render أو في بيئة محلية)
const app = express();
const port = 4000; // المنفذ الافتراضي
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = '7859625373:AAEFlMbm3Sfagj4S9rx5ixbfqItE1jNpDos';

// API Keys مباشرة في الكود
const WEATHER_API_KEY = '2fb04804fafc0c123fe58778ef5d878b'; // ضع مفتاح API الخاص بالطقس
const CURRENCY_API_KEY = '5884bd60fbdb6ea892ed9b76'; // ضع مفتاح API الخاص بالعملات

// إعداد OAuth2 من Google API
const oauth2Client = new google.auth.OAuth2(
    '723821711417-jnu2nv8d7356jvjijlgtfnjed5nvth9m.apps.googleusercontent.com',  // استبدل بـ Client ID الخاص بك
    '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', // استبدل بـ Client Secret الخاص بك
    'https://github.com/1900mr/resend/blob/main/index.js' // استبدل بـ Redirect URI الخاص بك
);

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
                
                [{ text: "🌤️ أحوال الطقس" }, { text: "💰 أسعار العملات" }],
                [{ text: "📅 التقويم والأحداث" }], // زر جديد للتقويم
                [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
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


// دالة للحصول على حالة الطقس في مدينة غزة فقط
async function getWeather() {
    try {
        const city = "Gaza"; // اسم المدينة ثابت هنا كـ "غزة"
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=ar`);
        const data = response.data;
        return `
🌤️ **حالة الطقس في ${data.name}**:
- درجة الحرارة: ${data.main.temp}°C
- حالة السماء: ${data.weather[0].description}
- الرطوبة: ${data.main.humidity}%
- الرياح: ${data.wind.speed} متر/ثانية
        `;
    } catch (error) {
        return "❌ لم أتمكن من الحصول على بيانات الطقس في مدينة غزة. يرجى المحاولة لاحقًا.";
    }
}


// دالة للحصول على أسعار العملات
async function getCurrencyRates() {
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${CURRENCY_API_KEY}/latest/USD`);
        const data = response.data;

        // احصل على أسعار العملات المطلوبة
        const usdToIls = data.conversion_rates.ILS; // 1 USD إلى شيكل إسرائيلي
        const ilsToJod = data.conversion_rates.JOD; // 1 ILS إلى دينار أردني
        const ilsToEgp = data.conversion_rates.EGP; // 1 ILS إلى جنيه مصري

        return `
💰 **أسعار العملات الحالية**:
- 1 دولار أمريكي (USD) = ${usdToIls} شيكل إسرائيلي (ILS)
- 1 شيكل إسرائيلي (ILS) = ${ilsToJod} دينار أردني (JOD)
- 1 شيكل إسرائيلي (ILS) = ${ilsToEgp} جنيه مصري (EGP)
        `;
    } catch (error) {
        return "❌ لم أتمكن من الحصول على أسعار العملات. يرجى المحاولة لاحقًا.";
    }
}

// دالة لعرض الأحداث من Google Calendar
async function getGoogleCalendarEvents() {
    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // استرجاع الأحداث القادمة
        const res = await calendar.events.list({
            calendarId: 'primary', // تقويم المستخدم الأساسي
            timeMin: (new Date()).toISOString(),
            maxResults: 5, // الحصول على أقرب 5 أحداث
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;
        if (events.length) {
            let eventMessage = "📅 **الأحداث القادمة**:\n";
            events.forEach((event, index) => {
                eventMessage += `
${index + 1}. **${event.summary}**
تاريخ: ${new Date(event.start.dateTime || event.start.date).toLocaleString()}
        `;
            });
            return eventMessage;
        } else {
            return "❌ لا توجد أحداث قادمة.";
        }
    } catch (error) {
        return "❌ حدث خطأ أثناء جلب الأحداث.";
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
    } else if (input === "📅 التقويم والأحداث") {
        bot.sendMessage(chatId, "📡 جاري تحميل الأحداث القادمة...");
        const events = await getGoogleCalendarEvents();
        bot.sendMessage(chatId, events);
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
