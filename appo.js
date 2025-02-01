import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5ZE1m5qe10pbAiZcSjBkIVDVNZExtf5U",
  authDomain: "elferdaws-1a362.firebaseapp.com",
  projectId: "elferdaws-1a362",
  storageBucket: "elferdaws-1a362.firebasestorage.app",
  messagingSenderId: "74289958469",
  appId: "1:74289958469:web:4ab94014a6afc191b61d2c"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// التحقق من حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("المستخدم مسجل:", user.email);
    // قم بتحميل البيانات هنا
    loadAppointments();
  } else {
    console.log("المستخدم غير مسجل");
    // قم بتوجيه المستخدم إلى صفحة تسجيل الدخول
    loginUser("user@example.com", "password123");
  }
});

// تسجيل دخول المستخدم
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("تم تسجيل الدخول بنجاح:", userCredential.user);
  } catch (error) {
    console.error("حدث خطأ أثناء تسجيل الدخول:", error.message);
  }
}

// تعريف المستخدم الحالي قبل أي استخدام
const currentUser = {
  name: "اسم المستخدم", // يمكن استبدال هذه القيمة بقيمة ديناميكية
  id: 1 // يمكن إضافة المزيد من الخصائص حسب الحاجة
};

// الآن يمكنك استخدام currentUser في أي مكان داخل الكود

// تحميل المواعيد من localStorage عند تحميل الصفحة
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let historyAppointments = JSON.parse(localStorage.getItem('historyAppointments')) || [];

// عرض تاريخ اليوم
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG');

// تحميل البيانات عند فتح الصفحة
moveUpcomingToToday();
loadAppointments();

function hideConnectionMessage() {
    const connectionMessage = document.getElementById('connectionMessage');
    if (connectionMessage) {
        connectionMessage.style.display = 'none'; // إخفاء الرسالة
    }
}

// التحقق من الاتصال بالإنترنت بعد تحميل الصفحة
window.addEventListener('load', () => {
    if (!checkInternetConnection()) {
        showConnectionMessage();
    } else {
        hideConnectionMessage();
    }
});



if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registered successfully.'))
        .catch((error) => console.error('Service Worker registration failed:', error));
}

// عرض تاريخ اليوم
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG');

// نقل الموعد إلى سجل المواعيد عند اتخاذ إجراء
function moveToHistory(appointmentId, action) {
  const appointmentIndex = appointments.findIndex(app => app.id === appointmentId);
  if (appointmentIndex !== -1) {
    const appointment = appointments[appointmentIndex];
    appointment.action = action; // الإجراء المتخذ (مكتمل، ملغي، مؤجل)
    historyAppointments.push(appointment);
    appointments.splice(appointmentIndex, 1); // إزالة الموعد من القائمة الرئيسية
    localStorage.setItem('appointments', JSON.stringify(appointments));
    localStorage.setItem('historyAppointments', JSON.stringify(historyAppointments));
    loadAppointments();
    loadHistoryAppointments();
  }
}

// تحميل سجل المواعيد
function loadHistoryAppointments() {
  const historyTableBody = document.querySelector('#history-appointments tbody');
  historyTableBody.innerHTML = "";

  historyAppointments.forEach((appointment, index) => {
    historyTableBody.innerHTML += `
      <tr onclick="showAppointmentDetails(${appointment.id})">
        <td>${index + 1}</td>
        <td>${appointment.clientName}</td>
        <td>${appointment.time}</td>
        <td>${appointment.date}</td>
        <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
        <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
        <td>${appointment.address}</td>
        <td>${appointment.issue}</td>
        <td>${appointment.deviceType}</td>
        <td>${appointment.deviceName}</td>
        <td>${appointment.notes}</td>
        <td>${appointment.action}</td>
      </tr>
    `;
  });
}

// دالة لعرض تفاصيل الموعد
function showAppointmentDetails(appointmentId) {
  const appointment = historyAppointments.find(app => app.id === appointmentId);
  if (appointment) {
    const detailsContent = document.getElementById('appointmentDetailsContent');
    let detailsHTML = `
      <p><strong>اسم العميل:</strong> ${appointment.clientName}</p>
      <p><strong>المشكلة:</strong> ${appointment.issue}</p>
      <p><strong>نوع الجهاز:</strong> ${appointment.deviceType}</p>
      <p><strong>ملاحظات:</strong> ${appointment.notes}</p>
      <p><strong>الإجراء المتخذ:</strong> ${appointment.action}</p>
      <p><strong>أضيف بواسطة:</strong> ${appointment.addedBy}</p>
    `;

    // إضافة تفاصيل إضافية بناءً على الإجراء المتخذ
    if (appointment.action === 'مكتمل') {
      detailsHTML += `
        <p><strong>تفاصيل الصيانة:</strong> ${appointment.maintenanceDetails}</p>
        <p><strong>السعر:</strong> ${appointment.price}</p>
        <p><strong>الوقت والتاريخ الفعلي:</strong> ${appointment.actualDateTime}</p>
        <p><strong>قطع الغيار:</strong> ${appointment.spareParts.join(', ')}</p>
      `;
    } else if (appointment.action === 'ملغي') {
      detailsHTML += `<p><strong>سبب الإلغاء:</strong> ${appointment.cancelReason}</p>`;
    } else if (appointment.action === 'سحب للورشة') {
      detailsHTML += `<p><strong>ملاحظات الورشة:</strong> ${appointment.workshopNotes}</p>`;
    }

    detailsContent.innerHTML = detailsHTML;
    openModal('appointmentDetailsModal');
  }
}



// تحميل البيانات عند فتح الصفحة
moveUpcomingToToday();
loadAppointments();

// إظهار واجهة إضافة موعد جديد
function showAddAppointment() {
  document.getElementById('add-appointment-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('upcoming-section').style.display = 'none';
  document.querySelector('.history-btn').style.display = 'none'; // إخفاء زر سجل المواعيد
  document.querySelector('.button-container').style.display = 'none'; // إخفاء حاوية الأزرار
  document.getElementById('history-section').style.display = 'none'; // إخفاء قسم سجل المواعيد
    document.querySelector('.floating-btn').style.display = 'none';
}

// إخفاء واجهة إضافة موعد جديد
function cancelAddAppointment() {
  document.getElementById('add-appointment-section').style.display = 'none';
  document.querySelector('.header').style.display = 'flex';
  document.querySelector('.upcoming-btn').style.display = 'block';
  document.querySelector('.missed-section').style.display = 'block';
  document.querySelector('.appointments-section').style.display = 'block';
  document.querySelector('.pending-section').style.display = 'block';
  document.querySelector('.history-btn').style.display = 'block'; // إعادة عرض زر سجل المواعيد
  document.querySelector('.button-container').style.display = 'flex'; // إعادة عرض حاوية الأزرار
    document.querySelector('.floating-btn').style.display = 'block';
}


async function saveAppointment() {
  const clientName = document.getElementById('client-name').value;
  const appointmentTime = document.getElementById('appointment-time').value;
  const appointmentDate = document.getElementById('appointment-date').value;
  const phone = document.getElementById('phone').value;
  const altPhone = document.getElementById('alt-phone').value;
  const address = document.getElementById('address').value;
  const issue = document.getElementById('issue').value;
  const deviceType = document.getElementById('device-type').value;
  const deviceName = document.getElementById('device-name').value;
  const notes = document.getElementById('notes').value;
  const noDateCheckbox = document.getElementById('no-date-checkbox').checked;

  const newAppointment = {
    id: Date.now(),
    clientName,
    time: noDateCheckbox ? null : appointmentTime,
    date: noDateCheckbox ? null : appointmentDate,
    phone,
    altPhone,
    address,
    issue,
    deviceType,
    deviceName,
    notes,
    status: noDateCheckbox ? "بانتظار تحديد موعد" : "قيد الانتظار",
    addedBy: currentUser.name,
    userId: currentUser.id
  };

  // التحقق من تاريخ الموعد (فقط إذا كان هناك تاريخ)
  if (!noDateCheckbox) {
    const currentDate = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (appointmentDateTime < currentDate) {
      alert("التاريخ قديم! يرجى تعديل التاريخ أو الوقت.");
      return;
    }
  }

  // إضافة الموعد إلى المواعيد الخاصة بالمستخدم
  let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
  appointments.push(newAppointment);
  localStorage.setItem('appointments', JSON.stringify(appointments));

  // حفظ الموعد في Firebase
  try {
    const appointmentsCollectionRef = collection(firestore, "appointments");
    await addDoc(appointmentsCollectionRef, newAppointment);
    console.log("تم حفظ الموعد في Firebase بنجاح!");
  } catch (error) {
    console.error("حدث خطأ أثناء حفظ الموعد في Firebase:", error);
  }

  // تفريغ الحقول بعد الحفظ
  document.getElementById('add-appointment-form').reset();

  // إعادة تحميل الجداول
  loadAppointments();
  cancelAddAppointment();
  
  
console.log(noDateCheckbox);

console.log(appointments); // قم بطباعة المواعيد بعد الحفظ للتأكد

}

// نقل المواعيد من "المواعيد القادمة" إلى "مواعيد اليوم" عند حلول تاريخها
function moveUpcomingToToday() {
  const currentDate = new Date();
  appointments = appointments.map(appointment => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime.toDateString() === currentDate.toDateString() && appointment.status === "قيد الانتظار") {
      appointment.status = "مواعيد اليوم";
    }
    return appointment;
  });
  localStorage.setItem('appointments', JSON.stringify(appointments));
}



async function fetchAppointmentsFromServer() {
  try {
    const appointmentsCollectionRef = collection(firestore, "appointments");
    const appointmentsSnapshot = await getDocs(appointmentsCollectionRef);
    const appointmentsList = appointmentsSnapshot.docs.map(doc => doc.data());

    // حفظ البيانات في localStorage
    localStorage.setItem('appointments', JSON.stringify(appointmentsList));
    loadAppointments(); // إعادة تحميل المواعيد
  } catch (error) {
    console.error("حدث خطأ أثناء جلب المواعيد من Firebase:", error);
  }
}

function displayAppointments(appointments) {
    const todayTableBody = document.querySelector('#today-appointments tbody');
    const missedTableBody = document.querySelector('#missed-appointments tbody');
    const upcomingTableBody = document.querySelector('#upcoming-appointments tbody');
    const pendingTableBody = document.querySelector('#pending-users tbody'); // تعريف pendingTableBody

    // تفريغ الجداول
    todayTableBody.innerHTML = "";
    missedTableBody.innerHTML = "";
    upcomingTableBody.innerHTML = "";
    pendingTableBody.innerHTML = ""; // تفريغ جدول "مستخدمين بانتظار تحديد موعد"

    appointments.forEach((appointment, index) => {
        const appointmentDateTime = appointment.date ? new Date(`${appointment.date}T${appointment.time}`) : null;

        if (appointment.status === "بانتظار تحديد موعد") {
            // صف لجدول "مستخدمين بانتظار تحديد موعد"
            const pendingRow = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${appointment.clientName}</td>
                    <td>${appointment.phone}</td>
                    <td>${appointment.altPhone}</td>
                    <td>${appointment.address}</td>
                    <td>${appointment.issue}</td>
                    <td>${appointment.deviceType}</td>
                    <td>${appointment.deviceName}</td>
                    <td>${appointment.notes}</td>
                    <td>
                        <select onchange="handleActionChange(this, ${appointment.id})">
                            <option value="">اختر إجراء</option>
                            <option value="completed">مكتمل</option>
                            <option value="workshop">سحب للورشة</option>
                            <option value="cancelled">ملغي</option>
                            <option value="postponed">تأجيل</option>
                        </select>
                    </td>
                </tr>
            `;
            pendingTableBody.innerHTML += pendingRow;
        } else if (appointmentDateTime && appointmentDateTime.toDateString() === new Date().toDateString()) {
            // صف لجدول مواعيد اليوم (بدون حقل التاريخ)
            const todayRow = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${appointment.clientName}</td>
                    <td>${appointment.time}</td>
                    <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
                    <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
                    <td>${appointment.address}</td>
                    <td>${appointment.issue}</td>
                    <td>${appointment.deviceType}</td>
                    <td>${appointment.deviceName}</td>
                    <td>${appointment.notes}</td>
                    <td>
                        <select onchange="handleActionChange(this, ${appointment.id})">
                            <option value="">اختر إجراء</option>
                            <option value="completed">مكتمل</option>
                            <option value="workshop">سحب للورشة</option>
                            <option value="cancelled">ملغي</option>
                            <option value="postponed">تأجيل</option>
                        </select>
                    </td>
                </tr>
            `;
            todayTableBody.innerHTML += todayRow;
        } else if (appointmentDateTime && appointmentDateTime < new Date()) {
            // صف لجدول المواعيد الفائتة (مع حقل التاريخ)
            const missedRow = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${appointment.clientName}</td>
                    <td>${appointment.time}</td>
                    <td>${appointment.date}</td>
                    <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
                    <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
                    <td>${appointment.address}</td>
                    <td>${appointment.issue}</td>
                    <td>${appointment.deviceType}</td>
                    <td>${appointment.deviceName}</td>
                    <td>${appointment.notes}</td>
                    <td>
                        <select onchange="handleActionChange(this, ${appointment.id})">
                            <option value="">اختر إجراء</option>
                            <option value="completed">مكتمل</option>
                            <option value="workshop">سحب للورشة</option>
                            <option value="cancelled">ملغي</option>
                            <option value="postponed">تأجيل</option>
                        </select>
                    </td>
                </tr>
            `;
            missedTableBody.innerHTML += missedRow;
        } else if (appointmentDateTime && appointmentDateTime > new Date()) {
            // صف لجدول المواعيد القادمة (مع حقل التاريخ)
            const upcomingRow = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${appointment.clientName}</td>
                    <td>${appointment.time}</td>
                    <td>${appointment.date}</td>
                    <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
                    <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
                    <td>${appointment.address}</td>
                    <td>${appointment.issue}</td>
                    <td>${appointment.deviceType}</td>
                    <td>${appointment.deviceName}</td>
                    <td>${appointment.notes}</td>
                    <td>
                        <select onchange="handleActionChange(this, ${appointment.id})">
                            <option value="">اختر إجراء</option>
                            <option value="completed">مكتمل</option>
                            <option value="workshop">سحب للورشة</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                    </td>
                </tr>
            `;
            upcomingTableBody.innerHTML += upcomingRow;
        }
    });
}

// إظهار المواعيد القادمة
function showUpcomingAppointments() {
  document.getElementById('upcoming-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.history-btn').style.display = 'none'; // إخفاء زر سجل المواعيد
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('add-appointment-section').style.display = 'none';
  document.getElementById('history-section').style.display = 'none'; // إخفاء قسم سجل المواعيد
  document.querySelector('.button-container').style.display = 'none'; // إخفاء حاوية الأزرار
  filterUpcomingAppointments();
  if (checkInternetConnection()) {
      document.getElementById('upcoming-section').style.display = 'block';
      document.querySelector('.header').style.display = 'none';
      document.querySelector('.upcoming-btn').style.display = 'none';
      document.querySelector('.missed-section').style.display = 'none';
      document.querySelector('.history-btn').style.display = 'none';
      document.querySelector('.appointments-section').style.display = 'none';
      document.querySelector('.pending-section').style.display = 'none';
      document.getElementById('add-appointment-section').style.display = 'none';
      document.getElementById('history-section').style.display = 'none';
      document.querySelector('.button-container').style.display = 'none';
      filterUpcomingAppointments();
  } else {
      showConnectionMessage();
  }
}

// تحميل البيانات عند فتح الصفحة
loadAppointments();


// تغيير طريقة الفلترة
function changeFilterMethod() {
  const filterMethod = document.getElementById('filter-method').value;
  const dateFilter = document.getElementById('date-filter');
  const nameFilter = document.getElementById('name-filter');

  if (filterMethod === 'date') {
    dateFilter.style.display = 'block';
    nameFilter.style.display = 'none';
  } else {
    dateFilter.style.display = 'none';
    nameFilter.style.display = 'block';
  }

  filterUpcomingAppointments();
}

// فلترة المواعيد القادمة
function filterUpcomingAppointments() {
  const filterMethod = document.getElementById('filter-method').value;
  const filterDate = document.getElementById('filter-date').value;
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const upcomingTableBody = document.querySelector('#upcoming-appointments tbody');
  upcomingTableBody.innerHTML = "";

  appointments.forEach((appointment, index) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const matchesFilter = filterMethod === 'date'
      ? (!filterDate || appointment.date === filterDate)
      : (appointment.clientName.toLowerCase().includes(searchInput) || appointment.includes(searchInput));

    if (appointmentDateTime > new Date() && matchesFilter) {
      upcomingTableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${appointment.clientName}</td>
          <td>${appointment.time}</td>
          <td>${appointment.date}</td>
          <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
          <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
          <td>${appointment.address}</td>
          <td>${appointment.issue}</td>
          <td>${appointment.deviceType}</td>
          <td>${appointment.deviceName}</td>
          <td>${appointment.notes}</td>
          <td>
            <select onchange="handleActionChange(this, ${appointment.id})">
              <option value="">اختر إجراء</option>
              <option value="completed">مكتمل</option>
              <option value="workshop">سحب للورشة</option>
              <option value="cancelled">ملغي</option>
            </select>
          </td>
        </tr>
      `;
    }
  });
}

// تغيير طريقة الفلترة في سجل المواعيد
function changeHistoryFilterMethod() {
  const filterMethod = document.getElementById('history-filter-method').value;
  const dateFilter = document.getElementById('history-date-filter');
  const nameFilter = document.getElementById('history-name-filter');

  if (filterMethod === 'date') {
    dateFilter.style.display = 'block';
    nameFilter.style.display = 'none';
  } else {
    dateFilter.style.display = 'none';
    nameFilter.style.display = 'block';
  }

  filterHistoryAppointments();
}

// فلترة المواعيد في سجل المواعيد
function filterHistoryAppointments() {
  const filterMethod = document.getElementById('history-filter-method').value;
  const filterDate = document.getElementById('history-filter-date').value;
  const searchInput = document.getElementById('history-search-input').value.toLowerCase();
  const historyTableBody = document.querySelector('#history-appointments tbody');
  historyTableBody.innerHTML = "";

  historyAppointments.forEach((appointment, index) => {
    const matchesFilter = filterMethod === 'date'
      ? (!filterDate || appointment.date === filterDate)
      : (appointment.clientName.toLowerCase().includes(searchInput) || appointment.phone.includes(searchInput));

    if (matchesFilter) {
historyTableBody.innerHTML += `
  <tr onclick="showAppointmentDetails(${appointment.id})">
    <td>${index + 1}</td>
    <td>${appointment.clientName}</td>
    <td>${appointment.time}</td>
    <td>${appointment.date}</td>
    <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
    <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
    <td>${appointment.address}</td>
    <td>${appointment.issue}</td>
    <td>${appointment.deviceType}</td>
    <td>${appointment.deviceName}</td>
    <td>${appointment.notes}</td>
    <td>${appointment.action}</td>
  </tr>
`;

    }
  });
}

// إظهار سجل المواعيد
function showHistory() {
  document.getElementById('history-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.history-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('upcoming-section').style.display = 'none';
  document.getElementById('add-appointment-section').style.display = 'none';
  document.querySelector('.button-container').style.display = 'none'; // إخفاء حاوية الأزرار
  filterHistoryAppointments(); // تحميل المواعيد مع الفلترة الافتراضية
  if (checkInternetConnection()) {
      document.getElementById('history-section').style.display = 'block';
      document.querySelector('.header').style.display = 'none';
      document.querySelector('.upcoming-btn').style.display = 'none';
      document.querySelector('.history-btn').style.display = 'none';
      document.querySelector('.missed-section').style.display = 'none';
      document.querySelector('.appointments-section').style.display = 'none';
      document.querySelector('.pending-section').style.display = 'none';
      document.getElementById('upcoming-section').style.display = 'none';
      document.getElementById('add-appointment-section').style.display = 'none';
      document.querySelector('.button-container').style.display = 'none';
      filterHistoryAppointments();
  } else {
      showConnectionMessage();
  }
}

// متغير لتتبع الصفحة الحالية
let currentSection = "main"; // القسم الرئيسي افتراضيًا

// وظيفة للتحكم في سلوك زر الرجوع
function handleBackButton() {
  if (currentSection !== "main") {
    // إذا كان المستخدم ليس في الصفحة الرئيسية، ارجع إلى المحتوى الرئيسي
    showMainContent();
    currentSection = "main"; // تحديث المتغير ليعكس الصفحة الحالية
  } else {
    // إذا كان المستخدم في الصفحة الرئيسية، اخرج من القسم
    window.history.back(); // العودة إلى الصفحة السابقة
  }
}

// إضافة مستمع لحدث زر الرجوع في الهاتف
window.addEventListener("popstate", function (event) {
  handleBackButton();
});

// إظهار المحتوى الرئيسي
function showMainContent() {
  document.getElementById('upcoming-section').style.display = 'none';
  document.getElementById('history-section').style.display = 'none';
  document.getElementById('add-appointment-section').style.display = 'none';
  document.querySelector('.header').style.display = 'flex';
  document.querySelector('.button-container').style.display = 'flex';
  document.querySelector('.missed-section').style.display = 'block';
  document.querySelector('.appointments-section').style.display = 'block';
  document.querySelector('.pending-section').style.display = 'block';
  currentSection = "main"; // تحديث المتغير ليعكس الصفحة الحالية
}





// دالة للتحقق من الاتصال بالإنترنت
function checkInternetConnection() {
    return navigator.onLine; // تُرجع true إذا كان هناك اتصال بالإنترنت، و false إذا لم يكن هناك اتصال
}

function showConnectionMessage() {	
    const connectionMessage = document.getElementById('connectionMessage');
    if (connectionMessage) {
        connectionMessage.style.display = 'block';
    }
}

let currentAppointmentId = null; // لتخزين الموعد الحالي الذي يتم التعامل معه

// دالة لفتح النافذة المنبثقة
function openModal(modalId, appointmentId) {
  currentAppointmentId = appointmentId;
  document.getElementById(modalId).style.display = 'block';
}

// دالة لإغلاق النافذة المنبثقة
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// دالة لإضافة قطعة غيار
function addSparePart() {
  const container = document.getElementById('sparePartsContainer');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'sparePart';
  input.placeholder = 'اسم قطعة الغيار';
  container.appendChild(input);
}

// دالة لحفظ الموعد المكتمل
function saveCompletedAppointment() {
  const maintenanceDetails = document.getElementById('maintenanceDetails').value;
  const price = document.getElementById('price').value;
  const actualDateTime = document.getElementById('actualDateTime').value;
  const spareParts = Array.from(document.querySelectorAll('.sparePart')).map(input => input.value);

  const appointment = appointments.find(app => app.id === currentAppointmentId);
  if (appointment) {
    appointment.action = 'مكتمل';
    appointment.maintenanceDetails = maintenanceDetails;
    appointment.price = price;
    appointment.actualDateTime = actualDateTime;
    appointment.spareParts = spareParts;
    moveToHistory(appointment.id, 'مكتمل');
  }

  closeModal('completeModal');
}

// دالة لحفظ الموعد المسحوب للورشة
function saveWorkshopAppointment() {
  const workshopNotes = document.getElementById('workshopNotes').value;

  const appointment = appointments.find(app => app.id === currentAppointmentId);
  if (appointment) {
    appointment.action = 'سحب للورشة';
    appointment.workshopNotes = workshopNotes;
    moveToHistory(appointment.id, 'سحب للورشة');
  }

  closeModal('workshopModal');
}

// دالة لحفظ الموعد الملغي
function saveCancelledAppointment() {
  const cancelReason = document.getElementById('cancelReason').value;

  const appointment = appointments.find(app => app.id === currentAppointmentId);
  if (appointment) {
    appointment.action = 'ملغي';
    appointment.cancelReason = cancelReason;
    moveToHistory(appointment.id, 'ملغي');
  }

  closeModal('cancelModal');
}

// دالة لحفظ الموعد المؤجل
function savePostponedAppointment() {
  const newAppointmentDate = document.getElementById('newAppointmentDate').value;
  const newAppointmentTime = document.getElementById('newAppointmentTime').value;

  const appointment = appointments.find(app => app.id === currentAppointmentId);
  if (appointment) {
    // تحديث تاريخ ووقت الموعد
    appointment.date = newAppointmentDate;
    appointment.time = newAppointmentTime;

    // تحديث حالة الموعد إذا لزم الأمر
    appointment.status = "قيد الانتظار"; // أو أي حالة أخرى تناسب منطق التطبيق

    // حفظ التغييرات في localStorage
    localStorage.setItem('appointments', JSON.stringify(appointments));

    // إعادة تحميل المواعيد لتحديث الجدول
    loadAppointments();
  }

  closeModal('postponeModal');
}

// تعديل الأزرار في الجداول
function handleActionChange(selectElement, appointmentId) {
  const action = selectElement.value;
  if (action === "completed") {
    openModal('completeModal', appointmentId);
  } else if (action === "workshop") {
    openModal('workshopModal', appointmentId);
  } else if (action === "cancelled") {
    openModal('cancelModal', appointmentId);
  } else if (action === "postponed") {
    openModal('postponeModal', appointmentId);
  }
}

// دالة لفتح تطبيق الاتصال بالهاتف
function makeCall(phoneNumber) {
    if (phoneNumber) {
        window.open(`tel:${phoneNumber}`); // فتح تطبيق الاتصال بالهاتف
    } else {
        alert("رقم الهاتف غير متوفر.");
    }
}

// مستمع لحدث input على حقل رقم الهاتف
document.getElementById('phone').addEventListener('input', function() {
  const phoneNumber = this.value.trim(); // الحصول على رقم الهاتف المدخل
  const appointments = JSON.parse(localStorage.getItem('appointments')) || []; // تحميل المواعيد الحالية
  const historyAppointments = JSON.parse(localStorage.getItem('historyAppointments')) || []; // تحميل سجل المواعيد

  // البحث عن موعد سابق بنفس رقم الهاتف في المواعيد الحالية
  let previousAppointment = appointments.find(app => app.phone === phoneNumber);

  // إذا لم يتم العثور على الموعد في المواعيد الحالية، نبحث في سجل المواعيد
  if (!previousAppointment) {
    previousAppointment = historyAppointments.find(app => app.phone === phoneNumber);
  }

  if (previousAppointment) {
    // إذا تم العثور على موعد سابق، يتم ملء الحقول تلقائيًا فقط إذا كانت فارغة
    if (!document.getElementById('client-name').value) {
      document.getElementById('client-name').value = previousAppointment.clientName;
    }
    if (!document.getElementById('alt-phone').value) {
      document.getElementById('alt-phone').value = previousAppointment.altPhone;
    }
    if (!document.getElementById('address').value) {
      document.getElementById('address').value = previousAppointment.address;
    }
    if (!document.getElementById('issue').value) {
      document.getElementById('issue').value = previousAppointment.issue;
    }
    if (!document.getElementById('device-type').value) {
      document.getElementById('device-type').value = previousAppointment.deviceType;
    }
    if (!document.getElementById('device-name').value) {
      document.getElementById('device-name').value = previousAppointment.deviceName;
    }

    // الملاحظات لا يتم ملؤها تلقائيًا أبدًا
    document.getElementById('notes').value = '';
  }
});

//لاخفاء حقل الوقت والتاريخ
function toggleDateTimeFields() {
  const noDateCheckbox = document.getElementById('no-date-checkbox');
  const timeField = document.getElementById('appointment-time');
  const dateField = document.getElementById('appointment-date');

  if (noDateCheckbox.checked) {
    timeField.disabled = true;
    dateField.disabled = true;
  } else {
    timeField.disabled = false;
    dateField.disabled = false;
  }
}


// تحميل المواعيد
function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    displayAppointments(appointments); // عرض البيانات من localStorage دائمًا

    if (checkInternetConnection()) {
        // إذا كان هناك اتصال بالإنترنت، يمكنك جلب البيانات من الخادم هنا (إذا كان لديك خادم)
        fetchAppointmentsFromServer();
    }
}

// إرسال المواعيد إلى Firebase عند الاتصال بالإنترنت
async function syncAppointmentsToFirebase() {
  const appointments = JSON.parse(localStorage.getItem('appointments')) || [];

  const appointmentsCollectionRef = collection(firestore, "appointments");
  await setDocs(appointmentsCollectionRef, appointments);
}

// عند الاتصال بالإنترنت، نقوم بمزامنة المواعيد مع Firebase
window.addEventListener('online', () => {
  if (checkInternetConnection()) {
    syncAppointmentsToFirebase(); // مزامنة البيانات مع Firebase
  }
});