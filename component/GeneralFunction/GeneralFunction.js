import postData from '../../lib/Axios';
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
};

export const formatDateTable = (date) => {
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear();
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
};

export const formatColumnValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    return value === 0 ? '' : value.toLocaleString();
};

export const formatDateTime = (date) => {
    const day = String(date.getDate()).padStart(2, '0'); // Mengambil tanggal dan menambahkan 0 jika kurang dari 10
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mengambil bulan (0-indexed) dan menambahkan 0 jika kurang dari 10
    const year = date.getFullYear(); // Mengambil tahun
    const hours = String(date.getHours()).padStart(2, '0'); // Mengambil jam dan menambahkan 0 jika kurang dari 10
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Mengambil menit dan menambahkan 0 jika kurang dari 10
    const seconds = String(date.getSeconds()).padStart(2, '0'); // Mengambil detik dan menambahkan 0 jika kurang dari 10

    // Mengembalikan tanggal dalam format yang diinginkan
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

// export const formatDateYear = (dateString) => {
//     const dateParts = dateString.split('-');
//     const year = dateParts[0];
//     const month = String(dateParts[1]).padStart(2, '0');
//     const day = String(dateParts[2]).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// };

export const getDateMonthYear = (dateString) => {
    const dateObj = new Date(dateString);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${year}-${month}-${day}`;
};
// Func untuk request TGL
export const getYMD = (dateString) => {
    const dateObj = new Date(dateString);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${year}-${month}-${day}`;
};
export const formatDateSave = (date) => {
    if (date == null || date == '0000-00-00') {
        date = new Date();
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDateSaveFirst = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// export const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('id-ID', { style: 'decimal' }).format(amount);
// };

export const formatCurrency = (amount) => {
    if (amount === 0 || isNaN(amount)) {
        // Return '0' with separators for zero or invalid values
        return new Intl.NumberFormat('id-ID', { style: 'decimal' }).format(0);
    } else {
        // Return formatted amount for non-zero values
        return new Intl.NumberFormat('id-ID', { style: 'decimal' }).format(amount);
    }
};

export const getZFormat = (value) => {
    let formattedValue = String(value);
    if (formattedValue.includes('.00')) {
        formattedValue = formattedValue.replace('.00', '');
    }
    return formattedValue;
};

export const getZFormatWithDecimal = (value, decimal) => {
    let valueReturn = String(value);
    valueReturn = parseFloat(valueReturn).toFixed(decimal);
    return valueReturn;
};

export const formatRibuan = (number) => {
    if (number === undefined || number === null) {
        return '-';
    }
    return number.toLocaleString('id-ID');
};

export const formatDateTampil = (dateString) => {
    if (!dateString) return null;
    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    month = month.length === 1 ? '0' + month : month;
    let day = dateObj.getDate().toString();
    day = day.length === 1 ? '0' + day : day;
    return `${day}-${month}-${year}`;
};
// -----------------------------------------------------< Zona Waktu >
import { utcToZonedTime, format } from 'date-fns-tz';

const timeZone = 'Asia/Jakarta'; // Atur zona waktu Indonesia di sini

export const convertToISODate = (date) => {
    const zonedDate = utcToZonedTime(date, timeZone);
    return format(zonedDate, 'yyyy-MM-dd', { timeZone });
};
// -------------------------------------------------------< Exp >
// Fungsi untuk mengubah format tanggal dari "YYYY-MM-DD" menjadi "MM-YYYY"
export const formatTglExpiredOld = (tanggal) => {
    if (!tanggal) return ''; // Tambahkan pengecekan apakah tanggal adalah null atau tidak terdefinisi
    const [tahun, bulan, _] = tanggal.split('-');
    return `${bulan}-${tahun}`;
};
export const formatTglExpired = (tanggal) => {
    const date = new Date(tanggal);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month < 10 ? '0' + month : month}-${year}`;
};

export const getUserName = async (email) => {
    const requestBody = {
        Email: email
    };
    const vaData = await postData('/api/get_username', requestBody);
    const data = vaData.data;
    return data;
};

export const getEmail = async () => {
    const vaData = await postData('/api/get_email', {});
    const data = vaData.data;
    return data;
};

export const getDBConfig = async (...key) => {
    let requestBody = {
        kode: key
    };
    const getCfg = await postData('/api/config/get', requestBody);
    const data = getCfg.data.data;
    return data;
};

export const formatDatePdf = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
};

export const setLastFaktur = async (key) => {
    let requestBody = {
        Kode: key
    };
    await postData('/api/set_kode', requestBody);
    return;
};

export const getTglTransaksi = async () => {
    try {
        const getTglTransaksi = await postData('/api/get_tgl_transaksi', {});
        const data = getTglTransaksi.data;
        return data;
    } catch (error) {
        console.error(error);
    }
};

export const formatAndSetDate = (inputValue, setFunction) => {
    let formattedValue = inputValue.replace(/[^0-9]/g, ''); // Remove non-numeric characters

    if (formattedValue.length > 0) {
        formattedValue = formattedValue.replace(/(\d{2})(\d{1,2})(\d{0,4})/, '$1-$2-$3'); // Add separators
    }

    // Update the calendar value based on the formatted date
    if (formattedValue.length === 10) {
        const [day, month, year] = formattedValue.split('-').map(Number);
        if (year >= 1000) {
            setFunction(new Date(year, month - 1, day));
        }
    }
};

export const subtractOneDay = (dateString) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1); // Mengurangkan 1 hari dari tanggal
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export const subtractOneDayYMD = (dateString) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1); // Mengurangkan 1 hari dari tanggal
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

export const getNameMonth = (date) => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
};

export const getGudang = async (key) => {
    let requestBody = {
        UserName: key
    };
    const getCfg = await postData('/api/getGudang', requestBody);
    const data = getCfg.data;
    return data;
};

export const getKeterangan = async (kode, field, table) => {
    let requestBody = {
        Kode: kode,
        Field: field,
        Table: table
    };
    const getCfg = await postData('/api/getKeterangan', requestBody);
    const data = getCfg.data;
    return data;
};

export const showSuccess = (toast, detail) => {
    toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
};

export const showError = (toast, detail) => {
    toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
};

export const rupiahConverter = (number = 0) => {
    const formattedNumber = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);

    return formattedNumber.replace('Rp', 'Rp.');
};
