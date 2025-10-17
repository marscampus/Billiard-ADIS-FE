// Header.js

import 'jspdf-autotable'; // Import jspdf-autotable untuk menggunakan fungsi autoTable
import { formatDatePdf, getDBConfig } from '../GeneralFunction/GeneralFunction';

export const Header = async ({ doc, marginTopInMm, judulLaporan, faktur, supplier, namaSupplier, addressSupplier, rowTgl }) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'no_telp');

    const imgBase64 = config.logo;
    const headerTitle = config.nama_hotel;
    const address = config.alamat_hotel;
    const phoneNumber = `No. Telp : ` + config.no_telp;
    // const supplier = "Supplier: XYZ Company";
    // const addressSupplier = "Address: XYZ Street, ABC City";

    const imageWidth = 20;
    const textXPosition = 10;
    const textRightXPosition = pageWidth - 10;

    // Logo
    // doc.addImage(imgBase64, 'PNG', 10, 11, imageWidth, 0);

    // Left side header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headerTitle, textXPosition, 15 + marginTopInMm - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, textXPosition, 20 + marginTopInMm - 10);
    doc.text(phoneNumber, textXPosition, 25 + marginTopInMm - 10);

    // Right side header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    // doc.text(supplier, textRightXPosition, 15 + marginTopInMm - 10, { align: "right" });
    doc.text(namaSupplier, textRightXPosition, 20 + marginTopInMm - 10, { align: 'right' });
    console.log('halo');
    doc.text(addressSupplier, textRightXPosition, 25 + marginTopInMm - 10, { align: 'right' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);

    doc.text(judulLaporan, pageWidth / 2, 35 + marginTopInMm - 10, {
        align: 'center'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(faktur, pageWidth / 2, 40 + marginTopInMm - 10, { align: 'center' });

    const textYPosition = 48 + marginTopInMm - 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(rowTgl, pageWidth / 2, textYPosition, { align: 'center' });
    // doc.text('PO Date : ' + formatDate(tgl), textXPosition, textYPosition, { align: "left" });
    // doc.text('Delivery Date : ' + formatDate(tglDo), pageWidth / 2, textYPosition, { align: "center" });
    // doc.text('Payment Date : ' + formatDate(paymentDate), textRightXPosition, textYPosition, { align: "right" });
};

export const HeaderMutasiMember = async ({ doc, marginTopInMm, judulLaporan, kode, namaMember, addressMember }) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'no_telp');

    const imgBase64 = config.logo;
    const headerTitle = config.nama_hotel;
    const address = config.alamat_hotel;
    const phoneNumber = `No. Telp : ` + config.no_telp;
    // const supplier = "Supplier: XYZ Company";
    // const addressSupplier = "Address: XYZ Street, ABC City";

    const imageWidth = 20;
    const textXPosition = 10;
    const textRightXPosition = pageWidth - 10;

    // Logo
    // doc.addImage(imgBase64, 'PNG', 10, 11, imageWidth, 0);

    // Left side header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headerTitle, textXPosition, 15 + marginTopInMm - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, textXPosition, 20 + marginTopInMm - 10);
    doc.text(phoneNumber, textXPosition, 25 + marginTopInMm - 10);

    // Right side header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(kode, textRightXPosition, 15 + marginTopInMm - 10, { align: 'right' });
    doc.text(namaMember, textRightXPosition, 20 + marginTopInMm - 10, { align: 'right' });
    doc.text(addressMember, textRightXPosition, 25 + marginTopInMm - 10, { align: 'right' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(judulLaporan, pageWidth / 2, 35 + marginTopInMm - 10, {
        align: 'center'
    });

    // doc.setFont("helvetica", "normal");
    // doc.setFontSize(9);
    // doc.text(faktur, pageWidth / 2, 40 + marginTopInMm - 10, { align: "center" });

    // const textYPosition = 48 + marginTopInMm - 10;
    // doc.setFont("helvetica", "normal");
    // doc.setFontSize(9);
    // doc.text(rowTgl, pageWidth / 2, textYPosition, { align: "center" });
};
export const HeaderMutasiAllMember = async ({ doc, marginTopInMm, judulLaporan }) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'no_telp');

    const imgBase64 = config.logo;
    const headerTitle = config.nama_hotel;
    const address = config.alamat_hotel;
    const phoneNumber = `No. Telp : ` + config.no_telp;
    // const supplier = "Supplier: XYZ Company";
    // const addressSupplier = "Address: XYZ Street, ABC City";

    const imageWidth = 20;
    const textXPosition = 10;
    const textRightXPosition = pageWidth - 10;

    // Logo
    // doc.addImage(imgBase64, 'PNG', 10, 11, imageWidth, 0);

    // Left side header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headerTitle, textXPosition, 15 + marginTopInMm - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, textXPosition, 20 + marginTopInMm - 10);
    doc.text(phoneNumber, textXPosition, 25 + marginTopInMm - 10);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(judulLaporan, pageWidth / 2, 35 + marginTopInMm - 10, {
        align: 'center'
    });
};

export const HeaderMutasiDiskonPeriode = async ({ doc, marginTopInMm, judulLaporan, rowTgl }) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'no_telp');

    const imgBase64 = config.logo;
    const headerTitle = config.nama_hotel;
    const address = config.alamat_hotel;
    const phoneNumber = `No. Telp : ` + config.no_telp;
    // const supplier = "Supplier: XYZ Company";
    // const addressSupplier = "Address: XYZ Street, ABC City";

    const imageWidth = 20;
    const textXPosition = 10;
    const textRightXPosition = pageWidth - 10;

    // Logo
    // doc.addImage(imgBase64, 'PNG', 10, 11, imageWidth, 0);

    // Left side header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headerTitle, textXPosition, 15 + marginTopInMm - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, textXPosition, 20 + marginTopInMm - 10);
    doc.text(phoneNumber, textXPosition, 25 + marginTopInMm - 10);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(judulLaporan, pageWidth / 2, 35 + marginTopInMm - 10, {
        align: 'center'
    });
    const textYPosition = 48 + marginTopInMm - 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(rowTgl, pageWidth / 2, 40 + marginTopInMm - 10, { align: 'center' });
    // doc.text(rowTgl, pageWidth / 2, textYPosition, { align: "center" });
};

export const HeaderAsli = async ({ doc, marginTopInMm, judulLaporan, faktur }) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    // header PDF
    const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'no_telp');

    const imgBase64 = config.logo;
    const headerTitle = config.nama_hotel;
    const address = config.alamat_hotel;
    const phoneNumber = `No. Telp : ` + config.no_telp;
    const imageWidth = 20;
    const textXPosition = 10;
    // const textXPosition = 30;    // kalo pake logo

    // doc.addImage(imgBase64, 'PNG', 10, 11, imageWidth, 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headerTitle, textXPosition, 15 + marginTopInMm - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, textXPosition, 20 + marginTopInMm - 10);
    doc.text(phoneNumber, textXPosition, 25 + marginTopInMm - 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(judulLaporan, pageWidth / 2, 35 + marginTopInMm - 10, {
        align: 'center'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(faktur, pageWidth / 2, 41 + marginTopInMm - 10, { align: 'center' });
};

export const HeaderLaporan = async ({ doc, marginTopInMm, judulLaporan, periodeLaporan }) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    // header PDF
    const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'no_telp');

    const imgBase64 = config.logo;
    const headerTitle = config.nama_hotel;
    const address = config.alamat_hotel;
    const phoneNumber = `No. Telp : ` + config.no_telp;
    const imageWidth = 20;
    const textXPosition = 30;

    doc.addImage(imgBase64, 'PNG', 10, 11, imageWidth, 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headerTitle, textXPosition, 15 + marginTopInMm - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, textXPosition, 20 + marginTopInMm - 10);
    doc.text(phoneNumber, textXPosition, 25 + marginTopInMm - 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(judulLaporan, pageWidth / 2, 35 + marginTopInMm - 10, {
        align: 'center'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(periodeLaporan, pageWidth / 2, 41 + marginTopInMm - 10, { align: 'center' });
};

export const FooterSlip = async ({ doc, marginLeft, marginTop, marginRight }) => {
    const config = await getDBConfig('kota', 'nama_hotel');

    const kotaPerusahaan = config.kota;
    const namaPerusahaan = config.nama_hotel;
    // const getToday = await getTglTransaksi();
    const today = new Date();
    // Form Pengesahan
    var tableDataPengesahan = [
        ['', 'Menyetujui,', '    ', '                                  ', '    ', `${kotaPerusahaan}, ${formatDatePdf(today)}`],
        ['', '    ', '    ', '                                  ', '    ', `${namaPerusahaan}`],
        ['', '    ', '    ', '                                  ', '    ', 'Pembuat'],
        ['', '..............', '    ', '                                  ', '    ', '    ']
    ];
    var totalColumns = tableDataPengesahan[0].length; // Jumlah total kolom dalam tabel
    var options = {
        startY: doc.autoTable.previous.finalY + 5,
        theme: 'plain',
        margin: {
            top: marginTop,
            left: marginLeft,
            right: marginRight
        },
        styles: {
            width: '100%',
            cellWidth: 'auto',
            valign: 'middle',
            halign: 'center',
            columnWidth: 'auto'
        }
    };
    doc.autoTable({
        body: tableDataPengesahan,
        ...options
    });
};

export const HeaderSlip = async ({ doc, marginTopInMm, judulLaporan, faktur, supplier, namaSupplier, addressSupplier, rowTgl }) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'no_telp');

    const imgBase64 = config.logo;
    const headerTitle = config.nama_hotel;
    const address = config.alamat_hotel;
    const phoneNumber = `No. Telp : ` + config.no_telp;
    // const supplier = "Supplier: XYZ Company";
    // const addressSupplier = "Address: XYZ Street, ABC City";

    const imageWidth = 20;
    const textXPosition = 10;
    const textRightXPosition = pageWidth - 10;

    // Logo
    // doc.addImage(imgBase64, 'PNG', 10, 11, imageWidth, 0);

    // Left side header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headerTitle, textXPosition, 15 + marginTopInMm - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, textXPosition, 20 + marginTopInMm - 10);
    doc.text(phoneNumber, textXPosition, 25 + marginTopInMm - 10);

    // Right side header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    // doc.text(supplier, textRightXPosition, 15 + marginTopInMm - 10, { align: "right" });
    doc.text(namaSupplier, textRightXPosition, 20 + marginTopInMm - 10, { align: 'right' });
    doc.text(addressSupplier, textRightXPosition, 25 + marginTopInMm - 10, { align: 'right' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(judulLaporan, pageWidth / 2, 35 + marginTopInMm - 10, {
        align: 'center'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(faktur, pageWidth / 2, 40 + marginTopInMm - 10, { align: 'center' });

    const textYPosition = 48 + marginTopInMm - 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(rowTgl, pageWidth / 2, textYPosition, { align: 'center' });
    // doc.text('PO Date : ' + formatDate(tgl), textXPosition, textYPosition, { align: "left" });
    // doc.text('Delivery Date : ' + formatDate(tglDo), pageWidth / 2, textYPosition, { align: "center" });
    // doc.text('Payment Date : ' + formatDate(paymentDate), textRightXPosition, textYPosition, { align: "right" });
};

export const Footer = async ({ doc, marginLeft, marginTop, marginRight, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 }) => {
    const config = await getDBConfig('kota', 'nama_hotel');

    const kotaPerusahaan = config.kota;
    const namaPerusahaan = config.nama_hotel;
    // const getToday = await getTglTransaksi();
    const today = new Date();
    // Form Pengesahan
    var tableDataPengesahan = [
        ['', '', '', '', '', `${kotaPerusahaan}, ${formatDatePdf(today)}`],
        ['', '', '', '', '', `${namaPerusahaan}`],
        ['', `${paraf1}`, '', '', '', `${paraf2}`],
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', '..............', '', '', '', '.............'],
        ['', `${namaPetugas1}`, '', '', '', `${namaPetugas2}`],
        ['', `${jabatan1}`, '', '', '', `${jabatan2}`]
    ];

    var options = {
        startY: doc.autoTable.previous.finalY + 10,
        theme: 'plain',
        margin: {
            top: marginTop,
            left: marginLeft,
            right: marginRight
        },
        styles: {
            fontSize: 10,
            valign: 'middle',
            halign: 'center'
        }
    };

    doc.autoTable({
        body: tableDataPengesahan,
        ...options
    });
};

export const addPageInfo = async (doc, userName, marginRightInMm) => {
    const options = { hour12: false, timeZone: 'Asia/Jakarta' };
    const currentDate = new Date().toLocaleString('id-ID', options);

    // Membuat teks informasi halaman
    const pageInfo = 'Page ' + doc.internal.getCurrentPageInfo().pageNumber;
    const userInfo = userName + ' | ' + currentDate;

    // Mendapatkan lebar dan tinggi halaman
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Menghitung posisi X dan Y untuk teks informasi halaman
    const pageTextX = pageWidth - marginRightInMm;
    const pageTextY = pageHeight - 10;

    // Menambahkan teks informasi halaman ke halaman
    doc.setFontSize(8);
    doc.text(pageInfo, pageTextX, pageTextY, { align: 'right' });
    doc.text(userInfo, pageTextX, pageTextY + 5, { align: 'right' });
};
