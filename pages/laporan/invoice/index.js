import { getSessionServerSide } from '../../../utilities/servertool';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useRef, useState } from 'react';
import { convertToISODate, rupiahConverter } from '../../../component/GeneralFunction/GeneralFunction';
import { Toast } from 'primereact/toast';
import postData from '../../../lib/Axios';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PrintInvoice from '../../component/printInvoice';
import { useReactToPrint } from 'react-to-print';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

const LaporanInvoice = (props) => {
    //state
    const strukRef = useRef(null);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [dataInvoice, setDataInvoice] = useState({
        data: [],
        load: false,
        tglLaporan: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)],
        searchVal: '',
        dataDetail: [],
        showDetail: false,
        showDelete: false,
        dataEdit: {}
    });
    const toast = useRef(null);

    const [pdf, setPdf] = useState({
        uri: '',
        show: false,
        load: false,
        data: {}
    });
    //

    //function
    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setDataInvoice((prev) => ({ ...prev, searchVal: value }));
    };

    const loadImageAsBase64 = (src) => {
        return new Promise((resolve, reject) => {
            fetch(src)
                .then((res) => res.blob())
                .then((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
        });
    };

    const getDataInvoice = async () => {
        setDataInvoice((prev) => ({ ...prev, load: true, data: [] }));
        try {
            const [tgl_awal, tgl_akhir] = dataInvoice.tglLaporan.map((item) => {
                return convertToISODate(item);
            });

            const res = await postData('/api/invoice/laporan', { tgl_awal, tgl_akhir });
            const data = res.data.data;

            console.log(data);

            const processedData = data.map((invoice) => ({
                ...invoice,
                kamar_list: invoice.kamar.map((k) => k.no_kamar).join(', ')
            }));

            setDataInvoice((prev) => ({ ...prev, load: false, data: processedData }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataInvoice((prev) => ({ ...prev, load: false, data: [] }));
        }
    };

    const getDataPdf = async (kode_invoice) => {
        setPdf((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData('/api/invoice/get-pdf', { kode_invoice });
            const data = res.data.data;

            console.log(data);
            // printPdf(data);
            // setPdf((prev) => ({ ...prev, show: true, load: false }));

            await getBase64ImageResolution(data.logo_hotel).then(({ width, height }) => {
                console.log(`Resolusi gambar: ${width}x${height}`);

                if (width > 500 || height > 500) {
                    showError('Resolusi logo terlalu besar, sebaiknya resize ke <500x500 px');
                    return;
                }
            });

            setPdf((prev) => ({ ...prev, show: true, data: data }));
            setTimeout(() => {
                handlePrint();
            }, 500);
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setPdf((prev) => ({ ...prev, show: false, load: false }));
        } finally {
            setPdf((prev) => ({ ...prev, load: false }));
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData('/api/invoice/delete', { kode: dataInvoice.dataEdit.kode_invoice });
            showSuccess(res.data.message);
            setDataInvoice((p) => ({ ...p, showDelete: false, dataEdit: {} }));
            getDataInvoice();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    const handleCheckout = async (kode_kamar) => {
        setDataInvoice((prev) => ({ ...prev, load: true }));
        try {
            const [tgl_awal, tgl_akhir] = dataInvoice.tglLaporan.map((item) => {
                return convertToISODate(item);
            });

            const res = await postData('/api/invoice/checkout', { kode_kamar, tgl_awal, tgl_akhir });
            const data = res.data.data;
            console.log(data);

            setDataInvoice((prev) => ({ ...prev, load: false, data: data, showDetail: false }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataInvoice((prev) => ({ ...prev, load: false }));
        }
    };

    const getBase64ImageResolution = (base64) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
        });
    };

    const handlePrint = useReactToPrint({
        contentRef: strukRef,
        documentTitle: 'Invoice'
    });

    useEffect(() => {
        getDataInvoice();
    }, []);
    //

    //template
    const headerTemplate = () => {
        return (
            <>
                <div className="flex justify-content-between">
                    <div className="p-inputgroup" style={{ width: '50%' }}>
                        <Calendar
                            dateFormat="yy-mm-dd"
                            value={dataInvoice.tglLaporan[0]}
                            onChange={(e) => {
                                console.log(e.value);
                                setDataInvoice((prev) => ({ ...prev, tglLaporan: [e.value, prev.tglLaporan[1]] }));
                            }}
                            readOnlyInput
                        />

                        <Calendar
                            dateFormat="yy-mm-dd"
                            value={dataInvoice.tglLaporan[1]}
                            onChange={(e) => {
                                console.log(e.value);
                                setDataInvoice((prev) => ({ ...prev, tglLaporan: [prev.tglLaporan[0], e.value] }));
                            }}
                            readOnlyInput
                        />

                        <Button icon="pi pi-search" onClick={() => getDataInvoice()} />
                    </div>
                    <InputText value={dataInvoice.searchVal} placeholder="Search" onChange={onGlobalFilterChange} />
                </div>
            </>
        );
    };

    const invoiceAction = (rowData) => {
        return (
            <>
                <Button
                    loading={dataInvoice.load}
                    label={rowData.status == 0 ? 'Sudah Checkout' : 'Checkout'}
                    severity={rowData.status == 0 ? 'success' : 'danger'}
                    disabled={rowData.status == 0 ? true : false}
                    onClick={rowData.status == 0 ? '' : () => handleCheckout(rowData.kode_kamar)}
                />
            </>
        );
    };

    const printPdf = async (data) => {
        const doc = new jsPDF();

        const kamar = data.kamar.map((item) => [item.no_kamar, rupiahConverter(item.harga_kamar), item.cek_in, item.cek_out]);

        console.log(kamar);
        // Logo Sikop
        const imgBase64 = await loadImageAsBase64('/layout/images/godongpng.png');

        // Menambahkan gambar ke PDF
        // doc.addImage(imgBase64, 'PNG', 15, 15, 50, 13);

        // doc.setFont('Helvetica', 'normal');
        // doc.setFontSize(18);
        // doc.text('PT MARSTECH', 198, 20, null, null, 'right');

        // doc.setFont('Helvetica', 'normal');
        // doc.setFontSize(14);
        // doc.text('Jl. Margatama Asri IV', 198, 27, null, null, 'right');
        // doc.text('Kota Madiun, Jawa Timur', 198, 33, null, null, 'right');
        // doc.text('63118', 198, 39, null, null, 'right');
        // doc.addImage(data.logo_hotel, 'PNG', 15, 15, 50, 13);
        await getBase64ImageResolution(data.logo_hotel).then(({ width, height }) => {
            console.log(`Resolusi gambar: ${width}x${height}`);

            if (width > 500 || height > 500) {
                showError('Resolusi logo terlalu besar, sebaiknya resize ke <500x500 px');
            } else {
                doc.addImage(data.logo_hotel, 'PNG', 15, 8, 25, 25);
            }
        });

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(18);
        doc.text(data.nama_hotel, 198, 20, null, null, 'right');

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(data.alamat_hotel, 198, 27, null, null, 'right');
        doc.text(data.no_telp_hotel, 198, 33, null, null, 'right');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Invoice : ' + data.kode_invoice, 15, 43);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(14);
        doc.text('Invoice Date : ' + data.tgl_invoice, 15, 50);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Invoice To', 15, 70);
        doc.setFont('Helvetica', 'normal');
        doc.text(data.nama_tamu, 15, 77);
        doc.text(data.nik, 15, 84);
        doc.text(data.no_telepon, 15, 90);

        doc.autoTable({
            startY: 95,
            columnStyles: { 1: { halign: 'right' }, 0: { halign: 'left' } },
            styles: {
                lineWidth: 0.1,
                fontSize: 14,
                halign: 'center'
            },
            headStyles: {
                fillColor: [204, 201, 199],
                textColor: 20
            },
            head: [['Kamar', 'Harga Kamar', 'Checkin', 'Checkout']],
            body: kamar,
            // foot: [[{ content: 'Total Kamar', styles: { halign: 'right' } }, rupiahConverter(formik.values.total_kamar)]],
            didParseCell: (data) => {
                if (data.section === 'foot') {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.fillColor = [204, 204, 204];
                    data.cell.styles.textColor = 20;
                }
            },
            didDrawCell: (data) => {
                if (data.section === 'foot' && data.row.index === 1) {
                    // Baris kedua di foot
                    const { table, cell } = data;
                    const { x, y, width } = cell;
                    const borderY = y; // Koordinat garis di atas sel

                    data.doc.setLineWidth(0.5); // Ketebalan garis
                    data.doc.setDrawColor(240, 240, 240); // Warna garis (hitam)
                    data.doc.line(x, borderY, x + width, borderY); // Menggambar garis horizontal
                }
            }
        });

        const hargaKamar = Number(data.total_kamar) || 0;
        const dp = Number(data.dp) || 0;
        const diskonPersen = Number(data.disc) || 0;
        const ppnPersen = Number(data.ppn) || 0;

        const hargaSetelahDP = hargaKamar - dp;

        const jumlahDiskon = (hargaSetelahDP * diskonPersen) / 100;
        const hargaSetelahDiskon = hargaSetelahDP - jumlahDiskon;

        const jumlahPPN = (hargaSetelahDiskon * ppnPersen) / 100;
        const hargaTotal = hargaSetelahDiskon + jumlahPPN;

        const tableEndY = doc.lastAutoTable?.finalY || 50;

        // Posisi kolom
        const labelX = 15;
        const valueX = 78;

        doc.setFont('Helvetica', 'bold');
        doc.text('Perhitungan:', labelX, tableEndY + 10);

        doc.setFont('Helvetica', 'normal');
        doc.text('Harga Kamar', labelX, tableEndY + 20);
        doc.text(': ' + rupiahConverter(hargaKamar), valueX, tableEndY + 20);

        doc.text('DP', labelX, tableEndY + 27);
        doc.text(': -' + rupiahConverter(dp), valueX, tableEndY + 27);

        doc.text(`Diskon (${diskonPersen}%)`, labelX, tableEndY + 34);
        doc.text(': -' + rupiahConverter(jumlahDiskon), valueX, tableEndY + 34);

        doc.text(`PPN (${ppnPersen}%)`, labelX, tableEndY + 41);
        doc.text(': +' + rupiahConverter(jumlahPPN), valueX, tableEndY + 41);

        doc.setFont('Helvetica', 'bold');
        doc.text('Total Harga', labelX, tableEndY + 48);
        doc.text(': ' + rupiahConverter(hargaTotal), valueX, tableEndY + 48);

        const pembayaranStartY = tableEndY + 60;
        doc.setFont('Helvetica', 'bold');
        doc.text('Pembayaran:', labelX, pembayaranStartY);

        doc.setFont('Helvetica', 'bold');
        doc.text('Jumlah Pembayaran', labelX, pembayaranStartY + 10);
        doc.text(': ' + rupiahConverter(data.bayar), valueX, pembayaranStartY + 10);

        doc.setFont('Helvetica', 'normal');
        doc.text('Metode Pembayaran', labelX, pembayaranStartY + 17);
        doc.text(': ' + data.cara_bayar, valueX, pembayaranStartY + 17);

        doc.setFont('Helvetica', 'bold');
        doc.text('Status Pembayaran', labelX, pembayaranStartY + 24);
        doc.text(': ' + data.status_bayar, valueX, pembayaranStartY + 24);

        doc.setFont('Helvetica', 'normal');
        doc.text('Sisa Bayar', labelX, pembayaranStartY + 31);
        doc.text(': ' + rupiahConverter(data.sisa_bayar), valueX, pembayaranStartY + 31);

        doc.setFontSize(10);
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const date = new Date();
        const getTgl = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        doc.text('PDF Generated On ' + getTgl + '/' + month + '/' + year, pageWidth / 2, pageHeight - 20, {
            align: 'center'
        });
        const uri = doc.output('datauristring');
        setPdf((prev) => ({ ...prev, uri: uri }));
    };
    //

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDataInvoice((p) => ({ ...p, showDelete: false, dataEdit: {} }))} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <div className="card">
                <h4>Laporan Invoice</h4>
                <DataTable value={dataInvoice.data} size="small" filters={filters} globalFilterFields={['nik', 'nama_tamu', 'no_telepon', 'kode_invoice', 'kamar_list']} loading={dataInvoice.load} paginator rows={10} header={headerTemplate}>
                    <Column field="kode_invoice" header="Kode Invoice"></Column>
                    <Column field="kamar_list" header="Kamar dipakai"></Column>
                    <Column field="nik" header="KTP"></Column>
                    <Column field="nama_tamu" header="Nama Tamu"></Column>
                    <Column field="no_telepon" header="No Telepon"></Column>
                    <Column field="total_kamar" header="Total Kamar" body={(rowData) => rupiahConverter(rowData.total_kamar)}></Column>
                    <Column field="total_harga_real" header="Total Harga Asli" body={(rowData) => rupiahConverter(rowData.total_harga_real)}></Column>
                    <Column field="dp" header="Total DP" body={(rowData) => rupiahConverter(rowData.dp)}></Column>
                    {/* <Column field="total_bayar_tersisa" header="Total Bayar Yang Tersisa" body={(rowData) => rupiahConverter(rowData.total_bayar_tersisa)}></Column> */}
                    <Column field="bayar" header="Bayar" body={(rowData) => rupiahConverter(rowData.bayar)}></Column>
                    <Column field="sisa_bayar" header="Sisa Bayar" body={(rowData) => rupiahConverter(rowData.sisa_bayar)}></Column>
                    <Column field="cara_bayar" header="Metode Pembayaran"></Column>
                    <Column field="status_bayar" header="Status Bayar" body={(rowData) => <span className={rowData.status_bayar == '1' ? 'text-green-600' : 'text-red-600'}>{rowData.status_bayar > 0 ? 'Lunas' : 'Belum Lunas'}</span>}></Column>
                    <Column
                        header="Action"
                        body={(rowData) => {
                            return (
                                <div className="flex gap-1">
                                    <Button icon="pi pi-trash" tooltipOptions={{ position: 'top' }} tooltip="Hapus Transaksi" severity="danger" onClick={() => setDataInvoice((prev) => ({ ...prev, showDelete: true, dataEdit: rowData }))} />
                                    <Button icon="pi pi-file" tooltipOptions={{ position: 'top' }} tooltip="Cek Kamar" onClick={() => setDataInvoice((prev) => ({ ...prev, showDetail: true, dataDetail: rowData.kamar }))} />
                                    <Button icon="pi pi-print" tooltipOptions={{ position: 'top' }} tooltip="Print ulang" severity="warning" loading={pdf.load} onClick={() => getDataPdf(rowData.kode_invoice)} />
                                </div>
                            );
                        }}
                    ></Column>
                </DataTable>
            </div>
            <Dialog visible={dataInvoice.showDetail} onHide={() => setDataInvoice((prev) => ({ ...prev, showDetail: false, dataDetail: [] }))} style={{ width: '80%' }}>
                <DataTable value={dataInvoice.dataDetail}>
                    <Column field="no_kamar" header="No Kamar"></Column>
                    <Column field="harga_kamar" header="Harga Kamar" body={(rowData) => rupiahConverter(rowData.harga_kamar)}></Column>
                    <Column field="cek_in" header="CHeckin"></Column>
                    <Column field="cek_out" header="CHeckout"></Column>
                    <Column body={invoiceAction}></Column>
                </DataTable>
            </Dialog>
            {/* 
            <Dialog visible={pdf.show} style={{ width: '50vw' }} onHide={() => setPdf((prev) => ({ ...prev, show: false }))} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
                <iframe src={pdf.uri} width="100%" style={{ height: '100vh' }}></iframe>
            </Dialog> */}

            <Dialog header="Delete" visible={dataInvoice.showDelete} onHide={() => setDataInvoice((p) => ({ ...p, showDelete: false, dataEdit: {} }))} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{dataInvoice.dataEdit?.kode_invoice}</strong>
                    </span>
                </div>
            </Dialog>

            <div style={{ display: 'none' }}>
                <PrintInvoice
                    ref={strukRef}
                    sidebar={{
                        laporan: false,
                        reservasi: false
                    }}
                    data={pdf.data}
                />
            </div>
        </>
    );
};

export default LaporanInvoice;
