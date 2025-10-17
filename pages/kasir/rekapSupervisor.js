/**
 * Nama Program: GODONG POS - Rekap Sesi Jual
 * Pengembang: Salsabila Emma
 * Tanggal Pengembangan: 1 Jan 2024
 * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Rekap Sesi Jual
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { formatDate, formatRibuan, getDBConfig, showError } from '../../component/GeneralFunction/GeneralFunction';
import styles from '../../component/styles/dataTable.module.css';

import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import { HeaderLaporan } from '../../component/exportPDF/exportPDF';
import { InputNumber } from 'primereact/inputnumber';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/kasir');
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};
const Rekap = ({ rekapDialog, setRekapDialog, selectedRowDataRekap, setSelectedRowDataRekap, selectedRowData, setSelectedRowData, jurnalUangPecahan }) => {
    const apiEndPointStore = '/api/rekapkasir/save';
    const apiEndPointGetUangPecahan = '/api/uang_pecahan/get';
    const apiEndPointGetPenjualanBySesi = '/api/rekapkasir/get_penjualanBySesi';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const onPage = (event) => {
        setlazyState(event);
    };
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const statusBodyTemplate = (rowData) => {
        return rowData.STATUS == 0 ? 'Kertas' : 'Logam';
    };

    const [rekap, setRekap] = useState([]);
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _rekap = { ...rekap };
        _rekap[name] = val;
        setRekap(_rekap);
    };

    const [uangPecahanTabel, setUangPecahanTabel] = useState([]);
    const [totalRecordsUangPecahan, setTotalRecordsUangPecahan] = useState(0);

    useEffect(() => {
        if (rekapDialog) {
            togglePenjualanBySesi();
            loadLazyData();
        }
    }, [jurnalUangPecahan]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGetUangPecahan, lazyState);
            const jsonUangPecahan = vaTable.data;

            // Gabungkan data dari server dengan data QTY dan JUMLAH dari jurnalUangPecahan
            const uangPecahanDataWithQtyAndJumlah = jsonUangPecahan.data.map((item) => {
                const existingData = jurnalUangPecahan.find((jurnalItem) => jurnalItem.NOMINAL === item.NOMINAL && jurnalItem.STATUS === item.STATUS);
                return {
                    ...item,
                    QTY: existingData ? existingData.QTY : 0,
                    // STATUS: existingData.STATUS,
                    JUMLAH: existingData ? existingData.QTY * existingData.NOMINAL : 0
                };
            });
            setUangPecahanTabel(uangPecahanDataWithQtyAndJumlah);
            setTotalRecordsUangPecahan(jsonUangPecahan.total);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const shiftDialogFooter = <div>{/* Your footer content goes here */}</div>;

    const [selectedOption, setSelectedOption] = useState('Rekap Nota');
    const handleRadioChange = (e) => {
        setSelectedOption(e.value);
    };

    // ----------------------------------------------------------------------------< edit in cell >
    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;

        switch (field) {
            case 'QTY':
                if (!isNaN(newValue)) {
                    // Check if newValue is a valid number
                    const editedQty = parseFloat(newValue);

                    if (!isNaN(editedQty)) {
                        // Check if editedQty is a valid number
                        const updatedUangPecahanTabel = uangPecahanTabel.map((item) => {
                            if (item.NOMINAL === rowData.NOMINAL && item.STATUS === rowData.STATUS) {
                                const nominal = item.NOMINAL || 0;
                                const jumlah = editedQty * nominal;
                                const updatedRowData = { ...item, QTY: editedQty, JUMLAH: jumlah };

                                return updatedRowData;
                            } else {
                                return item;
                            }
                        });

                        setUangPecahanTabel(updatedUangPecahanTabel);
                    } else {
                        console.error('Invalid input. Please enter a valid number for QTY.');
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.error('Invalid input. Please enter a valid number for QTY.');
                }
                break;

            default:
                break;
        }
    };

    const textEditor = (options) => {
        return <InputText step="any" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const totQty = uangPecahanTabel.reduce((accumulator, item) => accumulator + parseFloat(item.QTY), 0);
    const totJumlah = uangPecahanTabel.reduce((accumulator, item) => accumulator + parseFloat(item.JUMLAH), 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={2} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={isNaN(totQty) ? '-' : totQty.toLocaleString('id-ID')} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${isNaN(totJumlah) ? '-' : formatRibuan(totJumlah.toLocaleString('id-ID'))}`} footerStyle={{ textAlign: 'right' }} />
            </Row>
        </ColumnGroup>
    );

    // -----------------------------------------------------------------------------------------------< Get Penjualan by SesiJual >
    const [penjualanTabel, setPenjualanTabel] = useState([]);
    const [totPenjualanTabel, setTotPenjualanTabel] = useState([]);
    const togglePenjualanBySesi = async (event) => {
        setLoading(true);
        try {
            let requestBody = {
                SESIJUAL: selectedRowDataRekap.SESIJUAL
            };

            const vaTable = await postData(apiEndPointGetPenjualanBySesi, requestBody);
            const json = vaTable.data;
            // return;
            setPenjualanTabel(json.totPenjualan);
            setTotPenjualanTabel(json.total);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
        setLoading(false);
        // setLoadingCetak(false);
    };
    // -----------------------------------------------------------------------------------------------< Btn Cetak >
    const [loadingCetak, setLoadingCetak] = useState(false);
    const [isToggled, setIsToggled] = useState(false);

    const btnCetak = async (e) => {
        e.preventDefault();
        const namaPerusahaan = await getDBConfig('namaPerusahaan');
        const alamatPerusahaan = await getDBConfig('alamatPerusahaan');
        const telpPerusahaan = await getDBConfig('noPengaduan');
        const perusahaanInfo = alamatPerusahaan + ', ' + telpPerusahaan;
        const pdf = new jsPDF();

        pdf.setFontSize(9);

        // Tambahkan header (kop surat)
        const kopY = 10; // Jarak Y untuk KOP
        pdf.text(namaPerusahaan, 10, 10);
        pdf.text(perusahaanInfo, 10, 14);
        pdf.line(10, 18, 200, 18);

        const contentY = kopY + 15;
        pdf.setFontSize(14);
        // pdf.text('REKAPITULASI NOTA PENJUALAN', 110, contentY, { align: 'center' });
        const title = selectedOption === 'Rekap Nota' ? 'REKAPITULASI NOTA PENJUALAN' : 'REKAPITULASI DETAIL NOTA PENJUALAN';
        pdf.text(title, 110, contentY, { align: 'center' });

        pdf.setFontSize(10);
        const tanggalRekap = selectedRowDataRekap.TGL || '-';
        pdf.text(`Tanggal: ${formatDate(tanggalRekap)} | Kasir: ${selectedRowDataRekap.KASIR} | Kassa: ${selectedRowDataRekap.KASSA} | Shift: ${selectedRowDataRekap.SHIFT}`, 110, contentY + 5, { align: 'center' });

        // -------------------------------------------------------------------------------------------< tabel >
        const tableY = contentY + 10; // Sesuaikan jarak tabel dari konten

        //  if (penjualanTabel.length === 0 || penjualanTabel.length === null) {
        //     // Jika kosong, tampilkan pesan
        //     pdf.text('Tidak Ada Data Penjualan', 110, tableY + 10, { align: 'center', fontSize: 8 });
        //     // return; // Keluar dari fungsi
        // }
        const newRow = {
            FAKTUR: 'Total',
            TOTAL: totPenjualanTabel.totTotal || 0,
            TUNAI: totPenjualanTabel.totTunai || 0,
            EPAYMENT: totPenjualanTabel.totEpayment || 0,
            DEBET: totPenjualanTabel.totDebit || 0,
            DISCOUNT: totPenjualanTabel.totDisc || 0,
            PPN: totPenjualanTabel.totPPN || 0
        };
        penjualanTabel.push(newRow);
        let tableHeaders, tableData;
        if (selectedOption === 'Detail Nota') {
            tableHeaders = ['No', 'No Nota', 'Penjualan', 'Tunai', 'Epayment', 'Debet', 'Disc.', 'PPN'];
            tableData = penjualanTabel.map((item, index) => [index + 1, item.FAKTUR, formatRibuan(item.TOTAL), formatRibuan(item.TUNAI), formatRibuan(item.EPAYMENT), formatRibuan(item.DEBET), formatRibuan(item.DISCOUNT), item.PPN]);
        } else if (selectedOption === 'Rekap Nota') {
            tableHeaders = ['No', 'No Nota', 'Penjualan', 'Tunai', 'Epayment', 'Debet', 'Disc.', 'PPN'];
            tableData = [
                [
                    '',
                    'Rekap',
                    formatRibuan(totPenjualanTabel.totTotal),
                    formatRibuan(totPenjualanTabel.totTunai),
                    formatRibuan(totPenjualanTabel.totEpayment),
                    formatRibuan(totPenjualanTabel.totDebit),
                    formatRibuan(totPenjualanTabel.totDisc),
                    formatRibuan(totPenjualanTabel.totPPN)
                ]
            ];
        }
        // Hitung lebar kolom
        const colWidths = [10, 40, 22, 22, 22, 22, 22, 22];
        // Atur tinggi maksimal tabel agar tidak melebihi kertas
        const pageHeight = pdf.internal.pageSize.height;
        const margin = 10;
        const maxTableHeight = pageHeight - tableY - margin;

        pdf.autoTable({
            startY: tableY,
            head: [tableHeaders],
            body: tableData,
            headStyles: { fontSize: 8, fillColor: '#b6afac', halign: 'center' },
            columnStyles: {
                0: { cellWidth: colWidths[0], halign: 'center' },
                1: { cellWidth: colWidths[1], halign: 'center' },
                2: { cellWidth: colWidths[2], halign: 'right' },
                3: { cellWidth: colWidths[3], halign: 'right' },
                4: { cellWidth: colWidths[4], halign: 'right' },
                5: { cellWidth: colWidths[5], halign: 'right' },
                6: { cellWidth: colWidths[6], halign: 'right' },
                7: { cellWidth: colWidths[7], halign: 'right' }
                // Add more columns as needed
            },
            //  columnStyles: { 0: { cellWidth: colWidths[0] }, 1: { cellWidth: colWidths[1] }, 2: { cellWidth: colWidths[2] }, 3: { cellWidth: colWidths[3] }, 4: { cellWidth: colWidths[4] }, 5: { cellWidth: colWidths[5] }, 6: { cellWidth: colWidths[6] }, 7: { cellWidth: colWidths[7] }, 8: { cellWidth: colWidths[8] }, 9: { cellWidth: colWidths[9] } },
            theme: 'grid',
            styles: {
                cellPadding: 0.5, // Sesuaikan nilai ini untuk merapatkan jarak di dalam sel
                fontSize: 8,
                headStyles: {
                    fontSize: 8,
                    fillColor: '#b6afac'
                },
                bodyStyles: {
                    fontSize: 8
                }
            },
            margin: { top: 20 }, // Sesuaikan margin sesuai kebutuhan
            didDrawPage: function (data) {},
            bodyStyles: { fontSize: 8 }
        });
        // -------------------------------------------------------------------------------------------< Bawah Tabel >
        const spaceLeftX = 10; // Posisi X untuk kolom kiri
        const colWidth = 100; // Lebar kolom kiri
        const spaceRightX = spaceLeftX + colWidth + 10; // Posisi X untuk kolom kanan

        const tableHeight = pdf.autoTable.previous.finalY;
        const spaceHeight = 10; // Sesuaikan jarak antara tabel dan kolom kiri/kanan

        // Tentukan posisi Y untuk kolom kiri dan kanan
        const spaceLeftY = tableHeight + 10;
        const spaceRightY = tableHeight + 10;

        // Tambahkan space kolom kiri -----------------------------------------------------------------------------------< Sisi KIRI >
        const rincianTableY = spaceLeftY + spaceHeight;
        const rincianTableHeaders = ['JENIS', 'NOMINAL', 'QTY', 'JUMLAH'];
        // uangPecahanTabel.push(newRowUang);

        const rincianTableData = uangPecahanTabel.map((item) => [item.STATUS == 0 ? 'Kertas' : 'Logam', formatRibuan(item.NOMINAL), item.QTY, formatRibuan(item.JUMLAH)]);
        // Hitung lebar kolom
        const rincianColWidths = [20, 20, 15, 20];
        const cellHeight = 5;
        pdf.setFontSize(10);
        const titleX = spaceLeftX + (rincianColWidths.reduce((a, b) => a + b, 0) + (rincianColWidths.length - 1) * 2) / 2;
        pdf.text('Rincian Jumlah Uang', titleX, rincianTableY - 7, { align: 'center' });

        pdf.setFontSize(8);
        pdf.text(`QTY:  ${totQty}  |  Total:   ${formatRibuan(totJumlah)}  |  Selisih:  ${formatRibuan(totJumlah - JMLUANGTUNAI)}`, titleX - 35, rincianTableY - 1);
        pdf.autoTable({
            startY: rincianTableY,
            head: [rincianTableHeaders],
            body: rincianTableData,
            headStyles: { fontSize: 8, fillColor: '#b6afac', halign: 'center' },
            columnStyles: {
                0: { cellWidth: rincianColWidths[0] },
                1: { cellWidth: rincianColWidths[1], halign: 'right' },
                2: { cellWidth: rincianColWidths[2], halign: 'center' },
                3: { cellWidth: rincianColWidths[3], halign: 'right' }
            },
            theme: 'grid',
            styles: {
                cellPadding: 0.5, // Sesuaikan nilai ini untuk merapatkan jarak di dalam sel
                fontSize: 8,
                headStyles: {
                    fontSize: 8,
                    fillColor: '#b6afac'
                },
                bodyStyles: {
                    fontSize: 8
                }
            },
            bodyStyles: { fontSize: 8 },
            cellHeight: cellHeight
        });

        // Tambahkan space kolom Kanan -----------------------------------------------------------------------------------< Sisi KANAN >
        // const spaceRightTableY = spaceRightY + spaceHeight;
        const spaceRightTableY = rincianTableY;

        // Mendefinisikan data tabel yang akan ditampilkan di sebelah kanan
        const dataRightSide = [
            ['Kas Awal', ':', ` ${formatRibuan(selectedRowData.KASAWAL)}`],
            ['', '', ''],
            ['Total Penjualan', ':', `${formatRibuan(selectedRowData.TOTALJUAL)}`],
            ['PPN', ':', `${formatRibuan(selectedRowData.PPN)}`],
            ['Biaya Kartu Kredit', ':', `${formatRibuan(selectedRowData.BIAYAKARTU)}`],
            ['', '', '________________'],
            ['', '', `${formatRibuan(selectedRowData.SUBTOTAL1)}`],
            ['', '', ''],
            ['Kartu Kredit/Debit', ':', `${formatRibuan(selectedRowData.DEBIT)}`],
            ['e-Payment', ':', `${formatRibuan(selectedRowData.EPAYMENT)}`],
            ['Pengambilan Tunai', ':', `${formatRibuan(selectedRowData.PENGAMBILANTUNAI)}`],
            ['Voucher', ':', `${formatRibuan(selectedRowData.VOUCHER)}`],
            ['Discount Total', ':', `${formatRibuan(selectedRowData.DISCOUNT)}`],
            ['', '', '________________'],
            ['', '', `${formatRibuan(selectedRowData.SUBTOTAL2)}`],
            ['', '', ''],
            ['Total Uang Tunai', ':', `${formatRibuan(selectedRowData.JUMLAHUANG)}`]
        ];

        // Mengatur ukuran font teks pada dokumen PDF menjadi 12
        pdf.setFontSize(8);
        // Iterasi untuk menampilkan setiap pasangan label dan nilai pada dokumen PDF
        for (let i = 0; i < dataRightSide.length; i++) {
            const [label, char, value] = dataRightSide[i];

            // Menempatkan teks label pada posisi X dan Y tertentu di dokumen PDF
            pdf.text(label, spaceRightX, spaceRightTableY + i * 3);
            // Menempatkan teks label pada posisi X dan Y tertentu di dokumen PDF
            pdf.text(char, spaceRightX + 30, spaceRightTableY + i * 3);
            // Menempatkan teks nilai pada posisi X + 50 dan Y tertentu di dokumen PDF
            pdf.text(value, spaceRightX + 60, spaceRightTableY + i * 3, { align: 'right' });
        }

        // -------------------------------------------------------------------------------------------< TTD >

        const totalUangTunaiY = spaceRightTableY + (dataRightSide.length - 1) * 5; // Posisi Y "Total Uang Tunai"
        const garisPanjang = 70; // Atur panjang garis sesuai kebutuhan

        pdf.line(spaceRightX - 20, totalUangTunaiY - 15, spaceRightX + garisPanjang, totalUangTunaiY - 15);

        // pdf.text(`${selectedRowDataRekap.SUPERVISOR}`, spaceRightX + 20, totalUangTunaiY + 13, { align: 'center' });
        // pdf.text(`${selectedRowDataRekap.KASIR}`, spaceRightX + 50, totalUangTunaiY + 13, { align: 'center' });
        // pdf.line(spaceRightX - 20, totalUangTunaiY + 15, spaceRightX + garisPanjang, totalUangTunaiY + 15);
        // pdf.text('Seksi Toko', spaceRightX - 10, totalUangTunaiY + 20, { align: 'center' });
        // pdf.text('Supervisor', spaceRightX + 20, totalUangTunaiY + 20, { align: 'center' });
        // pdf.text('Kasir', spaceRightX + 50, totalUangTunaiY + 20, { align: 'center' });

        // Mengatur ulang posisi X untuk teks agar tersebar lebih merata
        pdf.text(`${selectedRowDataRekap.SUPERVISOR}`, spaceRightX - 30, totalUangTunaiY + 13, { align: 'center' });
        pdf.text(`${selectedRowDataRekap.KASIR}`, spaceRightX + 80, totalUangTunaiY + 13, { align: 'center' });

        // Menyesuaikan panjang garis
        pdf.line(spaceRightX - 40, totalUangTunaiY + 15, spaceRightX + 120, totalUangTunaiY + 15);

        // Memposisikan teks di bawah garis
        pdf.text('Seksi Toko', spaceRightX - 40, totalUangTunaiY + 20, { align: 'center' });
        pdf.text('Supervisor', spaceRightX + 0, totalUangTunaiY + 20, { align: 'center' });
        pdf.text('Kasir', spaceRightX + 80, totalUangTunaiY + 20, { align: 'center' });

        // -------------------------------------------------------------------------------------------< cetak >
        // Konversi PDF menjadi data URL
        const pdfDataUrl = pdf.output('datauristring');

        // Contoh cara membuka struk pada printer (perhatikan bahwa ini hanya contoh dan perlu penyesuaian)
        const printWindow = window.open(pdfDataUrl);
        printWindow.print();
    };

    const cetakThermal = async () => {
        // Buat instance jsPDF dengan ukuran kertas kecil (contoh 80mm x 120mm)
        // "unit: 'mm'" agar koordinat menggunakan milimeter
        // "format: [lebar, tinggi]"
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [80, 120]
        });

        const pageWidth = doc.internal.pageSize.getWidth();

        // Atur font. Courier sering dipakai untuk kesan "thermal printer".
        // (Beberapa font default: "helvetica", "times", "courier")
        doc.setFont('courier', 'normal');
        doc.setFontSize(10); // Sesuaikan ukuran font

        let yPos = 10; // Titik Y awal untuk menulis teks
        const marginLeft = 5;
        const marginRight = 5;

        // Fungsi bantu untuk menulis teks dan menambah posisi Y
        const text = (text, x = 5, incY = 5) => {
            doc.text(text, x, yPos);
            yPos += incY;
        };

        const drawDashedLine = (y) => {
            doc.setLineDash([1, 1]); // Pola garis (2mm garis, 2mm jarak)
            doc.line(marginRight, yPos, pageWidth - marginLeft, yPos);
            yPos += y;
            doc.setLineDash([]); // Reset ke garis biasa setelah pemisah
        };

        function textLeftRight(l, v = '', y) {
            // Hitung lebar teks value (untuk posisi kanan)

            const value = v?.toString();
            const label = l?.toString();

            const valueWidth = doc.getTextWidth(value);

            // Tulis value di kanan
            doc.text(value, pageWidth - marginRight - valueWidth - 2, yPos);
            // Tulis label di kiri
            doc.text(label, marginLeft, yPos);

            // Geser ke baris berikutnya
            yPos += y;
        }

        const date = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        const time = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`;

        // -- Contoh header --
        doc.setFontSize(12);
        text('REKAP TRANSAKSI', 20, 7);
        doc.setFontSize(9);
        text(`Sesi Jual ${selectedRowDataRekap.SESIJUAL}`, 13, 3);
        drawDashedLine(5);
        doc.setFontSize(10);
        textLeftRight(date, 'Kasir', 5);
        textLeftRight(time, selectedRowDataRekap.KASIR, 3);

        // Garis pemisah (pakai karakter '-')
        drawDashedLine(5);

        // -- Bagian detail transaksi --
        textLeftRight('Kas Awal', await formatRibuan(selectedRowData.KASAWAL), 5);
        textLeftRight('Tunai', await formatRibuan(selectedRowData.TUNAI), 5);
        textLeftRight('Debit Card', await formatRibuan(selectedRowData.DEBIT), 5);
        textLeftRight('e-Payment', await formatRibuan(selectedRowData.EPAYMENT), 3);

        drawDashedLine(5);

        textLeftRight('Disc/Brg', await formatRibuan(selectedRowData.DISCOUNTBRG), 5);
        textLeftRight('PPN/Brg', await formatRibuan(selectedRowData.PPNBRG), 5);
        textLeftRight('Sub Total', await formatRibuan(selectedRowData.SUBTOTAL), 5);
        textLeftRight('Diskon', await formatRibuan(selectedRowData.DISCOUNT), 5);
        textLeftRight('PPN', await formatRibuan(selectedRowData.PPN), 5);
        textLeftRight('Donasi', await formatRibuan(selectedRowData.DONASI), 5);
        textLeftRight('Total Penjualan', await formatRibuan(selectedRowData.TOTALJUAL), 3);

        drawDashedLine(5);

        textLeftRight('Uang Tunai', await formatRibuan(selectedRowData.KASAWAL + selectedRowDataRekap.TOTALJUAL), 3);

        // Setelah selesai, kita bisa langsung membuka di tab baru lalu print
        const pdfDataUrl = doc.output('datauristring');
        const printWindow = window.open(pdfDataUrl);
        if (printWindow) {
            printWindow.print();
        }
    };

    // ------------------------------------------------------------------------------------------------< Save >
    const onHideDialog = () => {
        setRekapDialog(false);
        setSelectedRowData([]);
        setRekap([]);
        setUangPecahanTabel([]);
    };
    const createDataObject = (selectedRowData) => {
        try {
            let _data = {
                KODESESI: selectedRowDataRekap.SESIJUAL,
                JUMLAHUANGFISIK: rekap.JUMLAHUANGFISIK,
                QTY: totQty,
                TOTAL: totJumlah,
                KETERANGAN: rekap.KETERANGAN || '',
                uangpecahan: uangPecahanTabel
                    .map((item) => {
                        return {
                            KODE: item.KODE,
                            TGL: selectedRowData.TGL,
                            STATUS: item.STATUS,
                            NOMINAL: item.NOMINAL,
                            QTY: item.QTY,
                            JUMLAH: item.JUMLAH
                        };
                    })
                    .filter((item) => item !== null)
            };
            if (_data.QTY === 0 && _data.TOTAL === 0) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Opname Uang Pecahan Masih Kosong!', life: 3000 });
                return;
            }
            return _data;
        } catch (error) {
            console.error('Error:', error);
            // Handle error if needed
        }
    };

    const saveRekap = async () => {
        let _data = createDataObject(selectedRowData);
        try {
            const vaTable = await postData(apiEndPointStore, _data);
            let data = vaTable.data;
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Rekap Berhasil Disimpan', life: 3000 });
            onHideDialog();
        } catch (error) {
            onHideDialog();
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-1 mr-2">
                    <Button label="Simpan" icon="pi pi-save" className="p-button-success mr-2" onClick={saveRekap} disabled={selectedRowDataRekap.STATUS === '2'} />
                </div>
                <div className="my-1 mr-2">
                    {/* <Button label="Cetak" icon="pi pi-file-pdf" className="p-button-success mr-2" onClick={btnCetak} /> */}
                    <Button label="Cetak" icon={loadingCetak ? 'pi pi-spin pi-spinner' : 'pi pi-file-pdf'} className={`p-button-success mr-2 ${loadingCetak ? 'p-disabled' : ''}`} onClick={btnCetak} />
                </div>
                <div className="my-1 mr-2">
                    <Button label="Cetak Thermal" icon={'pi pi-file-pdf'} className={`p-button-warning mr-2`} loading={loadingCetak} onClick={() => cetakThermal()} />
                </div>
            </React.Fragment>
        );
    };

    // Deklarasi variabel KASAWAL, TOTALJUAL, dan BIAYAKARTU
    const KASAWAL = selectedRowData?.KASAWAL || 0;
    const TOTALJUAL = selectedRowData?.TOTALJUAL || 0;
    const BIAYAKARTU = selectedRowData?.BIAYAKARTU || 0;
    const KARTU = selectedRowData?.KARTU || 0;
    const KREDIT = selectedRowData?.KREDIT || 0; // Ambil Tunai
    const VOUCHER = selectedRowData?.VOUCHER || 0;
    const EPAYMENT = selectedRowData?.EPAYMENT || 0;

    // Menghitung SUBTOTAL
    const SUBTOTAL = KASAWAL + TOTALJUAL + BIAYAKARTU;
    const SUBTOTAL2 = KARTU + KREDIT + VOUCHER + EPAYMENT;
    const JMLUANGTUNAI = SUBTOTAL - EPAYMENT - KARTU - KREDIT;

    const hideDialog = () => {
        setRekapDialog(false);
        setUangPecahanTabel([]);
        setSelectedRowData([]);
        setSelectedRowDataRekap([]);
        setTotPenjualanTabel([]);
        setPenjualanTabel([]);
    };

    return (
        <div>
            <Toast ref={toast} />
            <Dialog visible={rekapDialog} style={{ width: '80%' }} header="Rekap Penjualan" modal className="p-fluid" footer={shiftDialogFooter} onHide={hideDialog}>
                <div className="formgrid grid">
                    {/* ------------------------------------------------------------------------------------------- Left Tabel Uang Pecahan */}
                    <div className="field col-6 mb-2 lg:col-5">
                        {/* <div className={styles.datatableContainer}> */}
                        <DataTable
                            value={uangPecahanTabel}
                            lazy
                            // dataKey="QTY"
                            className="datatable-responsive"
                            totalRecords={totalRecordsUangPecahan}
                            loading={loading}
                            footerColumnGroup={footerGroup}
                            size="small"
                            editMode="cell"
                            scrollHeight="450px"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="STATUS" body={statusBodyTemplate} header="JENIS"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NOMINAL" header="NOMINAL" body={(rowData) => formatRibuan(rowData.NOMINAL)} bodyStyle={{ textAlign: 'right' }}></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="QTY"
                                header="QTY"
                                editor={(options) => textEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                // body={(rowData) => (rowData.QTY !== undefined && rowData.QTY !== null) ? rowData.QTY : 0}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="JUMLAH"
                                header="JUMLAH"
                                body={(rowData) => formatRibuan(rowData.JUMLAH)}
                                // body={(rowData) => formatRibuan(rowData.JUMLAH || jurnalUangPecahan.JUMLAH)}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            {/* body={(rowData) => (rowData.JUMLAH !== undefined && rowData.JUMLAH !== null) ? formatRibuan(rowData.JUMLAH) : 0} */}
                        </DataTable>
                        {/* </div> */}
                    </div>
                    {/* ------------------------------------------------------------------------------------------- Right Rekap */}
                    <div className="field col-6 mb-2 lg:col-7">
                        <div className="text-800 font-medium text-l">
                            <strong>Rekapitulasi Penjualan</strong>
                        </div>
                        <hr />
                        <div className="formgrid grid">
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="supervisor">Kas Awal</label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.KASAWAL)} onChange={(e) => onInputChange(e, 'KASAWAL')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="supervisor">Total Penjualan</label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.TOTALJUAL)} onChange={(e) => onInputChange(e, 'TOTALJUAL')} readOnly />
                                {/* <InputText
                                    style={{ height: "22px", textAlign: "right" }}
                                    value={selectedRowData && selectedRowData.TOTALJUAL > 0 ? formatRibuan(TOTALJUAL) : "ubah disini"}
                                    onChange={(e) => onInputChange(e, "TOTALJUAL")}
                                    readOnly
                                /> */}
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="supervisor">Change Credit Card</label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.BIAYAKARTU)} onChange={(e) => onInputChange(e, 'BIAYAKARTU')} readOnly />
                            </div>
                            <hr className="mt-1 mb-2" style={{ width: '100%', float: 'right', borderWidth: '2px' }} /> {/*  ---- hr ----  */}
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>
                                    <strong>Sub Total</strong>
                                </label>
                            </div>
                            <div className="field col-8 mb-4 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.SUBTOTAL1)} onChange={(e) => onInputChange(e, 'SUBTOTAL')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>Debit/Credit Card</label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.DEBIT)} onChange={(e) => onInputChange(e, 'DEBIT')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>Pengambilan Tunai</label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.PENGAMBILANTUNAI)} onChange={(e) => onInputChange(e, 'PENGAMBILANTUNAI ')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>Voucher</label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.VOUCHER)} onChange={(e) => onInputChange(e, 'VOUCHER')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>ePayment</label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.EPAYMENT)} onChange={(e) => onInputChange(e, 'EPAYMENT')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>
                                    <strong>Disc Total</strong>
                                </label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.DISCOUNT)} onChange={(e) => onInputChange(e, 'DISCOUNT')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>
                                    <strong>PPN Total</strong>
                                </label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.PPN)} onChange={(e) => onInputChange(e, 'PPN')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>
                                    <strong>Donasi Total</strong>
                                </label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.DONASI)} onChange={(e) => onInputChange(e, 'DONASI')} readOnly />
                            </div>
                            <hr className="mt-1 mb-2" style={{ width: '100%', float: 'right', borderWidth: '2px' }} /> {/*  ---- hr ----  */}
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>
                                    <strong>Sub Total</strong>
                                </label>
                            </div>
                            <div className="field col-8 mb-4 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.SUBTOTAL2)} onChange={(e) => onInputChange(e, 'SUBTOTAL2')} readOnly />
                            </div>
                            <hr className="mt-1 mb-3" style={{ width: '100%', float: 'right', borderWidth: '2px' }} /> {/*  ---- hr ----  */}
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>
                                    <strong>Jumlah</strong>
                                    {/* <strong>Jumlah Uang Tunai</strong> */}
                                </label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputText style={{ height: '22px', textAlign: 'right' }} value={formatRibuan(selectedRowData?.JUMLAHUANG)} onChange={(e) => onInputChange(e, 'JMLUANGTUNAI')} readOnly />
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label>
                                    <strong>Jumlah Uang Fisik</strong>
                                    {/* <strong>Jumlah Uang Tunai</strong> */}
                                </label>
                            </div>
                            <div className="field col-8 mb-2 lg:col-8">
                                <InputNumber inputStyle={{ height: '22px', textAlign: 'right' }} value={rekap?.JUMLAHUANGFISIK} onChange={(e) => onInputChange(e, 'JUMLAHUANGFISIK')} />
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="supervisor">Keterangan :</label>
                                <div className="p-inputgroup">
                                    <InputText value={rekap.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                {/* <label htmlFor="supervisor">Cetak Rekap Penjualan</label> */}
                                <div className="p-inputgroup">
                                    {/* Vertical arrangement of radio buttons */}
                                    <div className="p-field-radiobutton">
                                        <RadioButton className="mr-2 ml-2" inputId="rekapNota" name="kasAwalOption" value="Rekap Nota" onChange={handleRadioChange} checked={selectedOption === 'Rekap Nota'} />
                                        <label htmlFor="rekapNota">Rekap Nota</label>
                                    </div>
                                    <div className="p-field-radiobutton">
                                        <RadioButton className="mr-2 ml-2" inputId="detailNota" name="kasAwalOption" value="Detail Nota" onChange={handleRadioChange} checked={selectedOption === 'Detail Nota'} />
                                        <label htmlFor="detailNota">Detail Nota</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Toolbar className="mb-4" right={rightToolbarTemplate}></Toolbar>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Rekap;
